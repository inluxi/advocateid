import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { useTestDb } from "@/test/db";
import { domains, otpLogs, pageEventsRaw, pages, posts, reports, grievances, contactMessages, auditLog } from "@/db/schema";
import { seedDemo, seedReference } from "@/db/seed-run";
import { runNightly } from "@/jobs/nightly";
import { courtsEntries, postsEntries, profilesEntries, domainEntries, urlsetXml, staticEntries } from "@/lib/sitemaps";
import { resolveDomain } from "./domains";
import { createReport, createGrievance, createContactMessage, listReports, resolveReport, suspendPost, purgeContactMessages, purgeGrievances, audit, purgeAudit } from "./moderation";
import { getPageBySlug, suspendPage, setPlan } from "./pages";
import { runSearch } from "./search";
import { recordEvent } from "./analytics";
import { listLawyers, hideOnDomain, getMembership } from "./memberships";
import { listCourtUpdates } from "./posts";

process.env.SITE_ORIGIN = "https://advocateid.in";

beforeAll(async () => {
  await useTestDb();
  await seedReference();
  await seedDemo();
});

describe("sitemaps and custom domains", () => {
  it("lists active profiles, courts and posts; Premium with an active domain is left out of advocateid.in sitemaps", async () => {
    const rahul = (await getPageBySlug("rahul-nair-adv"))!;
    const before = (await profilesEntries(1)).map((e) => e.loc);
    expect(before.some((l) => l.endsWith("/rahul-nair-adv"))).toBe(true);
    await getDb().insert(domains).values({ pageId: rahul.id, hostname: "www.rahulnair-law.in", status: "active" });
    const after = (await profilesEntries(1)).map((e) => e.loc);
    expect(after.some((l) => l.endsWith("/rahul-nair-adv"))).toBe(false);
    // a lapsed domain brings the page back into the main sitemap (advocateid.in/{slug} becomes indexable again)
    await getDb().update(domains).set({ status: "lapsed" }).where(eq(domains.pageId, rahul.id));
    expect((await profilesEntries(1)).some((e) => e.loc.endsWith("/rahul-nair-adv"))).toBe(true);
    await getDb().update(domains).set({ status: "active" }).where(eq(domains.pageId, rahul.id));
  });

  it("serves a domain only while it is active and the page is Premium", async () => {
    expect((await resolveDomain("www.rahulnair-law.in"))?.page.slug).toBe("rahul-nair-adv");
    expect(await resolveDomain("unknown.example.com")).toBeNull();
    const rahul = (await getPageBySlug("rahul-nair-adv"))!;
    await setPlan(rahul.id, "professional", 1);
    expect(await resolveDomain("www.rahulnair-law.in")).toBeNull(); // downgraded: domain lapses, advocateid.in keeps working
    expect((await getPageBySlug("rahul-nair-adv"))?.status).toBe("active");
    await setPlan(rahul.id, "premium", 1);
  });

  it("per-domain sitemap has root-path URLs on its own host only", async () => {
    const firm = (await getPageBySlug("menon-associates"))!;
    const entries = await domainEntries("www.menon-law.in", firm.id);
    expect(entries.length).toBeGreaterThan(4);
    for (const e of entries) {
      expect(e.loc.startsWith("https://www.menon-law.in/")).toBe(true);
      expect(e.loc).not.toContain("advocateid.in");
    }
    expect(entries.some((e) => e.loc.endsWith("/lawyers"))).toBe(true);
    expect(urlsetXml(entries)).toContain("<urlset");
  });

  it("static sitemap includes info pages with hreflang and skips thin district pages", async () => {
    const entries = await staticEntries();
    expect(entries.some((e) => e.loc.endsWith("/privacy"))).toBe(true);
    expect(entries.find((e) => e.loc.endsWith("/d/ekm"))).toBeTruthy(); // 5 listings
    expect(entries.find((e) => e.loc.endsWith("/d/ksd"))).toBeUndefined(); // none
    expect(urlsetXml([{ loc: "https://advocateid.in/", hreflangPath: "/" }])).toContain('hreflang="ml" href="https://advocateid.in/ml"');
    expect((await courtsEntries(1)).length).toBe(15);
    expect((await postsEntries(1)).length).toBeGreaterThan(0);
  });
});

describe("moderation and compliance", () => {
  it("suspending a page removes it from search and sitemaps; restoring brings it back", async () => {
    const p = (await getPageBySlug("sneha-pillai"))!;
    await suspendPage(p.id, 1, "test", true);
    expect((await runSearch({ d: "ekm" })).cards.some((c) => c.slug === "sneha-pillai")).toBe(false);
    expect((await profilesEntries(1)).some((e) => e.loc.endsWith("/sneha-pillai"))).toBe(false);
    await suspendPage(p.id, 1, "restored", false);
    expect((await runSearch({ d: "ekm" })).cards.some((c) => c.slug === "sneha-pillai")).toBe(true);
    const log = await getDb().select().from(auditLog).where(eq(auditLog.resourceId, String(p.id)));
    expect(log.map((l) => l.action)).toEqual(expect.arrayContaining(["page_suspended", "page_restored"]));
  });

  it("reports target existing content, admin can suspend a post and the audit log records it", async () => {
    const post = (await getDb().select().from(posts).limit(1))[0];
    expect(await createReport({ targetType: "post", targetId: 999999, reason: "other" })).toBeNull();
    const id = await createReport({ targetType: "post", targetId: post.id, reason: "promotional" });
    expect(id).not.toBeNull();
    expect((await listReports("open")).some((r) => r.id === id)).toBe(true);
    await suspendPost(post.id, 1, "promotional wording");
    expect((await listCourtUpdates(post.courtId ?? 0)).some((u) => u.id === post.id)).toBe(false);
    await resolveReport(id!, "actioned", 1);
    expect((await getDb().select().from(reports).where(eq(reports.id, id!)))[0].status).toBe("actioned");
  });

  it("purges contact messages after 90 days, resolved grievances after 3 years and audit entries after a year", async () => {
    const db = getDb();
    const g = await createGrievance({ name: "A", contact: "a@example.com", subject: "S", message: "Message text here" });
    await db.update(grievances).set({ status: "resolved", updatedAt: new Date(Date.now() - 4 * 365 * 86400_000) }).where(eq(grievances.id, g));
    expect(await purgeGrievances()).toBe(1);
    const m = await createContactMessage({ kind: "general", name: "B", contact: "b@example.com", message: "Hello there" });
    await db.update(contactMessages).set({ createdAt: new Date(Date.now() - 91 * 86400_000) }).where(eq(contactMessages.id, m));
    expect(await purgeContactMessages()).toBe(1);
    await audit({ action: "old", resourceType: "x" });
    await db.update(auditLog).set({ timestamp: new Date(Date.now() - 400 * 86400_000) }).where(eq(auditLog.action, "old"));
    expect(await purgeAudit()).toBeGreaterThanOrEqual(1);
  });

  it("a lawyer can hide themselves from the firm's domain listing but stays on the firm page", async () => {
    const firm = (await getPageBySlug("menon-associates"))!;
    const all = await listLawyers(firm);
    expect(all.items.length).toBe(2);
    const m = (await getMembership(all.items[0].membership.id))!;
    await hideOnDomain(m, true);
    expect((await listLawyers(firm, { forDomain: true })).items.length).toBe(1);
    expect((await listLawyers(firm)).items.length).toBe(2);
    await hideOnDomain(m, false);
  });
});

describe("nightly job", () => {
  it("rolls up events, scores pages and purges data past retention in one run", async () => {
    const db = getDb();
    const p = (await getPageBySlug("asha-menon"))!;
    const now = new Date();
    await recordEvent({ pageId: p.id, host: "advocateid.in", visitorId: "v-night", eventType: "view", isOwner: false, isBot: false });
    await db.insert(pageEventsRaw).values({ pageId: p.id, host: "advocateid.in", visitorId: "old", eventType: "view", createdAt: new Date(now.getTime() - 40 * 86400_000) });
    await db.insert(otpLogs).values({ mobileHash: "x".repeat(64), otpHash: "y".repeat(64), expiresAt: now, createdAt: new Date(now.getTime() - 9 * 86400_000) });
    const out = await runNightly(now);
    expect(out.rolledUp).toBeGreaterThan(0);
    expect(out.rawEventsPurged).toBeGreaterThanOrEqual(1);
    expect(out.otpLogsPurged).toBeGreaterThanOrEqual(1);
    expect(out.pagesScored).toBeGreaterThan(5);
    const scored = (await db.select().from(pages).where(eq(pages.id, p.id)))[0];
    expect(scored.score).toBeGreaterThan(0);
  });
});

describe("erasure removes stored pictures", () => {
  it("deletes all three sizes of a page's pictures when the account is erased", async () => {
    const { mkdtemp, readdir } = await import("node:fs/promises");
    const os = await import("node:os");
    const path = await import("node:path");
    const dir = await mkdtemp(path.join(os.tmpdir(), "aid-up-"));
    process.env.UPLOAD_DIR = dir;
    const { getStorage } = await import("@/lib/storage");
    const { findOrCreateAccount } = await import("./auth");
    const { createPage } = await import("./pages");
    const { requestAccountDeletion, purgeDeletedAccounts } = await import("./privacy");
    const { pagePhotos, accounts, localities } = await import("@/db/schema");
    const acc = await findOrCreateAccount("+919777700001");
    const district = (await getDb().select().from(localities).where(eq(localities.code, "ekm")))[0];
    const page = await createPage(acc.id, { type: "advocate", name: "Erase Me", slug: "erase-pictures-1", districtId: district.id, enrolmentNo: "K/5/2020" });
    const key = `pages/${page.id}/photo/abc`;
    const storage = await getStorage();
    for (const s of ["s", "m", "l"]) await storage.put(`${key}-${s}.webp`, Buffer.from("x"), "image/webp");
    await getDb().insert(pagePhotos).values({ pageId: page.id, kind: "photo", storageKey: key });
    await requestAccountDeletion(acc.id);
    await getDb().update(accounts).set({ deletionRequestedAt: new Date(Date.now() - 31 * 86400_000) }).where(eq(accounts.id, acc.id));
    expect(await purgeDeletedAccounts()).toBe(1);
    const left = await readdir(path.join(dir, "pages", String(page.id), "photo")).catch(() => []);
    expect(left).toEqual([]);
  });
});
