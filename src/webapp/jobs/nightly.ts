import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { pages } from "@/db/schema";
import { log } from "@/lib/logger";
import { purgeRateLimits } from "@/lib/rate-limit";
import { purgeDailyEvents, purgeRawEvents, rollupDay } from "@/repo/analytics";
import { purgeExpiredSessions, purgeOtpLogs } from "@/repo/auth";
import { recheckDomains } from "@/repo/domains";
import { purgeAudit, purgeContactMessages, purgeGrievances } from "@/repo/moderation";
import { purgeDeletedAccounts, purgeSoftDeletedPages } from "@/repo/privacy";
import { rebuildSearchIndex, recomputeQuality } from "@/repo/search";

/**
 * Nightly job (Kubernetes CronJob calls `npm run job:nightly`, or POST /api/jobs/nightly with JOB_TOKEN).
 * 1. roll up yesterday's events (cleaned counts for ranking)  2. recompute quality scores and rebuild the index
 * 3. purge personal data past retention (DPDP)  4. re-check custom domains.
 */
export async function runNightly(now = new Date()): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  const yesterday = new Date(now.getTime() - 86400_000).toISOString().slice(0, 10);
  const today = now.toISOString().slice(0, 10);
  out.rolledUp = (await rollupDay(yesterday)) + (await rollupDay(today));

  const db = getDb();
  const all = await db.select({ id: pages.id }).from(pages).where(and(isNull(pages.deletedAt), eq(pages.status, "active")));
  for (const { id } of all) {
    await recomputeQuality(id);
    await rebuildSearchIndex(id);
  }
  out.pagesScored = all.length;

  out.rawEventsPurged = await purgeRawEvents(30);
  out.dailyEventsPurged = await purgeDailyEvents(365);
  out.otpLogsPurged = await purgeOtpLogs(7);
  out.sessionsPurged = await purgeExpiredSessions();
  out.rateLimitsPurged = await purgeRateLimits(24);
  out.contactMessagesPurged = await purgeContactMessages(90);
  out.grievancesPurged = await purgeGrievances(3);
  out.auditPurged = await purgeAudit(365);
  out.accountsErased = await purgeDeletedAccounts();
  out.pagesErased = await purgeSoftDeletedPages();
  const d = await recheckDomains();
  out.domainsLapsed = d.lapsed;
  out.domainsRecovered = d.recovered;
  log.info("nightly_done", out);
  return out;
}

if (process.argv[1] && /nightly\.ts$/.test(process.argv[1])) {
  runNightly()
    .then(() => process.exit(0))
    .catch((e) => {
      log.error("nightly_failed", e);
      process.exit(1);
    });
}
