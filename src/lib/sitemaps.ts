import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { courts, domains, localities, offices, pages, posts } from "@/db/schema";
import { entitlementsFor } from "./entitlements";
import { absolute } from "./url";
import { seoSlug } from "./text";
import { listCategories, listDistricts } from "@/repo/reference";
import { countsByDistrictForCategory } from "@/repo/search";
import { MIN_ADVOCATES_FOR_INDEX } from "./seo";

export const SITEMAP_PAGE_SIZE = 5000;

export interface UrlEntry {
  loc: string;
  lastmod?: Date | null;
  changefreq?: "daily" | "weekly" | "monthly";
  priority?: number;
  /** Path (without the /ml prefix) when a Malayalam version exists. */
  hreflangPath?: string;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function urlsetXml(entries: UrlEntry[]): string {
  const rows = entries.map((e) => {
    const alt = e.hreflangPath
      ? `<xhtml:link rel="alternate" hreflang="en" href="${esc(absolute(e.hreflangPath))}"/><xhtml:link rel="alternate" hreflang="ml" href="${esc(absolute(`/ml${e.hreflangPath === "/" ? "" : e.hreflangPath}`))}"/><xhtml:link rel="alternate" hreflang="x-default" href="${esc(absolute(e.hreflangPath))}"/>`
      : "";
    return `<url><loc>${esc(e.loc)}</loc>${alt}${e.lastmod ? `<lastmod>${e.lastmod.toISOString()}</lastmod>` : ""}${e.changefreq ? `<changefreq>${e.changefreq}</changefreq>` : ""}${e.priority != null ? `<priority>${e.priority.toFixed(1)}</priority>` : ""}</url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${rows.join("")}</urlset>`;
}

export function indexXml(files: { loc: string; lastmod?: Date | null }[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${files.map((f) => `<sitemap><loc>${esc(f.loc)}</loc>${f.lastmod ? `<lastmod>${f.lastmod.toISOString()}</lastmod>` : ""}</sitemap>`).join("")}</sitemapindex>`;
}

/** Profiles that search engines may index on advocateid.in: active, and not Premium with an active domain. */
function indexableProfileFilter() {
  return and(
    isNull(pages.deletedAt),
    eq(pages.status, "active"),
    sql`not exists (select 1 from ${domains} d where d.page_id = ${pages.id} and d.status = 'active' and d.deleted_at is null and ${pages.plan} = 'premium')`,
  );
}

export async function profilesEntries(n: number): Promise<UrlEntry[]> {
  const rows = await getDb().select({ slug: pages.slug, updatedAt: pages.updatedAt, type: pages.type }).from(pages).where(indexableProfileFilter()).orderBy(asc(pages.id)).limit(SITEMAP_PAGE_SIZE).offset((n - 1) * SITEMAP_PAGE_SIZE);
  return rows.map((r) => ({ loc: absolute(`/${r.slug}`), lastmod: r.updatedAt, changefreq: "weekly", priority: 0.7, hreflangPath: `/${r.slug}` }));
}

export async function officesEntries(n: number): Promise<UrlEntry[]> {
  const rows = await getDb()
    .select({ id: offices.id, name: offices.name, slug: pages.slug, updatedAt: offices.updatedAt })
    .from(offices)
    .innerJoin(pages, eq(pages.id, offices.pageId))
    .where(and(isNull(offices.deletedAt), sql`coalesce(trim(${offices.about}), '') <> ''`, indexableProfileFilter()))
    .orderBy(asc(offices.id))
    .limit(SITEMAP_PAGE_SIZE)
    .offset((n - 1) * SITEMAP_PAGE_SIZE);
  return rows.map((r) => ({ loc: absolute(`/${r.slug}/o/${r.id}/${seoSlug(r.name)}`), lastmod: r.updatedAt, changefreq: "monthly", priority: 0.5, hreflangPath: `/${r.slug}/o/${r.id}/${seoSlug(r.name)}` }));
}

export async function courtsEntries(n: number): Promise<UrlEntry[]> {
  const rows = await getDb().select({ id: courts.id, name: courts.name, updatedAt: courts.updatedAt }).from(courts).where(isNull(courts.deletedAt)).orderBy(asc(courts.id)).limit(SITEMAP_PAGE_SIZE).offset((n - 1) * SITEMAP_PAGE_SIZE);
  return rows.map((r) => ({ loc: absolute(`/c/${r.id}/${seoSlug(r.name)}`), lastmod: r.updatedAt, changefreq: "daily", priority: 0.8, hreflangPath: `/c/${r.id}/${seoSlug(r.name)}` }));
}

export async function postsEntries(n: number): Promise<UrlEntry[]> {
  const rows = await getDb()
    .select({ id: posts.id, title: posts.title, type: posts.type, updatedAt: posts.updatedAt, pageId: posts.pageId })
    .from(posts)
    .leftJoin(pages, eq(pages.id, posts.pageId))
    .where(and(isNull(posts.deletedAt), eq(posts.status, "published"), sql`(${posts.pageId} is null or (${pages.status} = 'active' and ${pages.deletedAt} is null and not exists (select 1 from ${domains} d where d.page_id = ${pages.id} and d.status = 'active' and d.deleted_at is null and ${pages.plan} = 'premium')))`))
    .orderBy(asc(posts.id))
    .limit(SITEMAP_PAGE_SIZE)
    .offset((n - 1) * SITEMAP_PAGE_SIZE);
  return rows.map((r) => {
    const path = r.type === "court_update" ? `/u/${r.id}/${seoSlug(r.title)}` : `/post/${r.id}/${seoSlug(r.title)}`;
    return { loc: absolute(path), lastmod: r.updatedAt, changefreq: "monthly", priority: 0.6, hreflangPath: path };
  });
}

/** Home, info pages, practice areas, and district / district + practice pages that are not thin. */
export async function staticEntries(): Promise<UrlEntry[]> {
  const out: UrlEntry[] = [{ loc: absolute("/"), changefreq: "daily", priority: 1, hreflangPath: "/" }];
  for (const p of ["/about", "/contact", "/terms", "/privacy", "/grievance", "/pricing", "/practice"]) out.push({ loc: absolute(p), changefreq: "monthly", priority: 0.5, hreflangPath: p });
  const [cats, districts] = await Promise.all([listCategories(), listDistricts()]);
  for (const c of cats) out.push({ loc: absolute(`/practice/${c.slug}`), changefreq: "weekly", priority: 0.6, hreflangPath: `/practice/${c.slug}` });
  const perCat = new Map<string, Map<string, number>>();
  for (const c of cats) perCat.set(c.code, await countsByDistrictForCategory(c.code));
  const [dCounts] = await Promise.all([getDb().select({ d: sql<string>`district_code`, n: sql<number>`count(*)::int` }).from(sql`search_index`).where(sql`type = 'page'`).groupBy(sql`district_code`)]);
  const total = new Map(dCounts.map((r) => [r.d, r.n]));
  for (const d of districts) {
    if ((total.get(d.code) ?? 0) >= MIN_ADVOCATES_FOR_INDEX) {
      out.push({ loc: absolute(`/d/${d.code}`), changefreq: "daily", priority: 0.8, hreflangPath: `/d/${d.code}` });
      for (const c of cats) if ((perCat.get(c.code)?.get(d.code) ?? 0) >= MIN_ADVOCATES_FOR_INDEX) out.push({ loc: absolute(`/d/${d.code}/practice-area/${c.slug}`), changefreq: "weekly", priority: 0.7, hreflangPath: `/d/${d.code}/practice-area/${c.slug}` });
    }
  }
  const locs = await getDb().select().from(localities).where(and(isNull(localities.deletedAt), sql`${localities.level} in ('city','locality')`));
  for (const l of locs) out.push({ loc: absolute(`/l/${l.id}/${seoSlug(l.name)}`), changefreq: "weekly", priority: 0.6, hreflangPath: `/l/${l.id}/${seoSlug(l.name)}` });
  return out;
}

export async function counts() {
  const db = getDb();
  const [p] = await db.select({ n: sql<number>`count(*)::int` }).from(pages).where(indexableProfileFilter());
  const [c] = await db.select({ n: sql<number>`count(*)::int` }).from(courts).where(isNull(courts.deletedAt));
  const [po] = await db.select({ n: sql<number>`count(*)::int` }).from(posts).where(and(isNull(posts.deletedAt), eq(posts.status, "published")));
  const [o] = await db.select({ n: sql<number>`count(*)::int` }).from(offices).where(and(isNull(offices.deletedAt), sql`coalesce(trim(${offices.about}), '') <> ''`));
  return { profiles: p?.n ?? 0, courts: c?.n ?? 0, posts: po?.n ?? 0, offices: o?.n ?? 0 };
}

/** Entries for a custom domain sitemap: its own root-path pages only. */
export async function domainEntries(hostname: string, pageId: number): Promise<UrlEntry[]> {
  const db = getDb();
  const origin = `https://${hostname}`;
  const [page] = await db.select().from(pages).where(eq(pages.id, pageId)).limit(1);
  if (!page || !entitlementsFor(page.plan).customDomain) return [];
  const out: UrlEntry[] = [{ loc: `${origin}/`, lastmod: page.updatedAt, priority: 1 }, { loc: `${origin}/posts`, priority: 0.8 }, { loc: `${origin}/offices`, priority: 0.6 }, { loc: `${origin}/contact`, priority: 0.4 }];
  if (page.type === "firm") out.push({ loc: `${origin}/lawyers`, priority: 0.7 });
  const ps = await db.select({ id: posts.id, title: posts.title, updatedAt: posts.updatedAt }).from(posts).where(and(eq(posts.pageId, pageId), eq(posts.type, "article"), eq(posts.status, "published"), isNull(posts.deletedAt)));
  for (const p of ps) out.push({ loc: `${origin}/p/${p.id}/${seoSlug(p.title)}`, lastmod: p.updatedAt, priority: 0.7 });
  const os = await db.select({ id: offices.id, name: offices.name, updatedAt: offices.updatedAt }).from(offices).where(and(eq(offices.pageId, pageId), isNull(offices.deletedAt), sql`coalesce(trim(${offices.about}), '') <> ''`));
  for (const o of os) out.push({ loc: `${origin}/o/${o.id}/${seoSlug(o.name)}`, lastmod: o.updatedAt, priority: 0.5 });
  return out;
}
