import dns from "node:dns/promises";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { domains, pages } from "@/db/schema";
import { entitlementsFor } from "@/lib/entitlements";
import { cnameTarget, validateHostname } from "@/lib/host";
import { log } from "@/lib/logger";
import { DomainError, type PageRow } from "./pages";

export type DomainRow = typeof domains.$inferSelect;

export async function getDomainForPage(pageId: number): Promise<DomainRow | null> {
  const [r] = await getDb().select().from(domains).where(and(eq(domains.pageId, pageId), isNull(domains.deletedAt))).limit(1);
  return r ?? null;
}

export async function addDomain(page: PageRow, hostnameInput: string): Promise<DomainRow> {
  if (!entitlementsFor(page.plan).customDomain) throw new DomainError("plan_required", "A custom domain needs the Premium plan.", 402);
  const hostname = validateHostname(hostnameInput);
  if (!hostname) throw new DomainError("hostname_invalid", "Enter a domain such as www.example.com.");
  const db = getDb();
  const clash = await db.select({ id: domains.id }).from(domains).where(and(eq(domains.hostname, hostname), isNull(domains.deletedAt))).limit(1);
  if (clash[0]) throw new DomainError("hostname_taken", "This domain is already connected to a page.", 409);
  const current = await getDomainForPage(page.id);
  if (current) await db.update(domains).set({ status: "removed", deletedAt: new Date(), deletedBy: "owner" }).where(eq(domains.id, current.id));
  // A previously removed row may hold the hostname (unique index): reuse it
  const old = await db.select().from(domains).where(eq(domains.hostname, hostname)).limit(1);
  if (old[0]) {
    const [row] = await db.update(domains).set({ pageId: page.id, status: "pending", deletedAt: null, deletedBy: null, updatedAt: new Date() }).where(eq(domains.id, old[0].id)).returning();
    return row;
  }
  const [row] = await db.insert(domains).values({ pageId: page.id, hostname, status: "pending" }).returning();
  return row;
}

export async function removeDomain(page: PageRow): Promise<void> {
  const cur = await getDomainForPage(page.id);
  if (!cur) return;
  await getDb().update(domains).set({ status: "removed", deletedAt: new Date(), deletedBy: "owner" }).where(eq(domains.id, cur.id));
}

/** DNS check: the hostname must CNAME to {slug}.p.<root> (or resolve to the same addresses when the registrar flattens CNAMEs). */
export async function dnsPointsToUs(hostname: string, slug: string): Promise<boolean> {
  const target = cnameTarget(slug).toLowerCase();
  try {
    const cnames = await dns.resolveCname(hostname);
    if (cnames.some((c) => c.toLowerCase().replace(/\.$/, "") === target)) return true;
  } catch {
    /* no CNAME record: try address comparison */
  }
  try {
    const [a, b] = await Promise.all([dns.resolve4(hostname).catch(() => [] as string[]), dns.resolve4(target).catch(() => [] as string[])]);
    return a.length > 0 && a.some((ip) => b.includes(ip));
  } catch {
    return false;
  }
}

/**
 * Optional Cloudflare for SaaS custom hostname (certificate issued by Cloudflare).
 * Without credentials the ingress/cert-manager setup is expected to provide TLS.
 */
async function requestCertificate(hostname: string): Promise<string | null> {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const zone = process.env.CLOUDFLARE_ZONE_ID;
  if (!token || !zone) return null;
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zone}/custom_hostnames`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ hostname, ssl: { method: "http", type: "dv", settings: { min_tls_version: "1.2" } } }),
    });
    const data = (await res.json()) as { result?: { id?: string } };
    return data.result?.id ?? null;
  } catch (e) {
    log.error("cloudflare_custom_hostname_failed", e);
    return null;
  }
}

export async function verifyDomain(page: PageRow): Promise<DomainRow> {
  const db = getDb();
  const cur = await getDomainForPage(page.id);
  if (!cur) throw new DomainError("not_found", "No domain to verify.", 404);
  if (!entitlementsFor(page.plan).customDomain) throw new DomainError("plan_required", "A custom domain needs the Premium plan.", 402);
  const ok = await dnsPointsToUs(cur.hostname, page.slug);
  let cloudflareId = cur.cloudflareId;
  if (ok && !cloudflareId) cloudflareId = await requestCertificate(cur.hostname);
  const status = ok ? "active" : cur.status === "active" ? "lapsed" : "pending";
  const [row] = await db.update(domains).set({ status, cloudflareId, lastCheckedAt: new Date(), updatedAt: new Date() }).where(eq(domains.id, cur.id)).returning();
  return row;
}

export async function resolveDomain(hostname: string): Promise<{ page: PageRow; domain: DomainRow } | null> {
  const db = getDb();
  const [d] = await db.select().from(domains).where(and(eq(domains.hostname, hostname), eq(domains.status, "active"), isNull(domains.deletedAt))).limit(1);
  if (!d) return null;
  const [p] = await db.select().from(pages).where(and(eq(pages.id, d.pageId), isNull(pages.deletedAt), eq(pages.status, "active"))).limit(1);
  if (!p || !entitlementsFor(p.plan).customDomain) return null;
  return { page: p, domain: d };
}

/** Nightly: lapsed domains fall back to advocateid.in/{slug}; recovered ones come back. */
export async function recheckDomains(): Promise<{ checked: number; lapsed: number; recovered: number }> {
  const db = getDb();
  const rows = await db.select({ d: domains, p: pages }).from(domains).innerJoin(pages, eq(pages.id, domains.pageId)).where(and(isNull(domains.deletedAt)));
  let lapsed = 0;
  let recovered = 0;
  for (const { d, p } of rows) {
    if (d.status === "pending" || d.status === "removed") continue;
    if (!entitlementsFor(p.plan).customDomain) continue;
    const ok = await dnsPointsToUs(d.hostname, p.slug);
    if (d.status === "active" && !ok) {
      await db.update(domains).set({ status: "lapsed", lastCheckedAt: new Date(), updatedAt: new Date() }).where(eq(domains.id, d.id));
      lapsed++;
    } else if (d.status === "lapsed" && ok) {
      await db.update(domains).set({ status: "active", lastCheckedAt: new Date(), updatedAt: new Date() }).where(eq(domains.id, d.id));
      recovered++;
    }
  }
  return { checked: rows.length, lapsed, recovered };
}
