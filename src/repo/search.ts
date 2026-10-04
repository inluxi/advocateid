import { and, asc, desc, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  careerEntries,
  categories,
  courts,
  localities,
  memberships,
  officeCourts,
  offices,
  pageAdvocate,
  pageCategories,
  pageCourts,
  pageDailyEvents,
  pageFirm,
  pageLanguages,
  pageScores,
  pages,
  posts,
  searchIndex,
} from "@/db/schema";
import { visibleItems } from "@/lib/entitlements";
import { computeQuality, haversineKm, rank, type Candidate, type RankContext, type Ranked, type SortMode } from "@/lib/ranking";
import { escapeLike, yearsSince } from "@/lib/text";
import type { Lang } from "@/lib/i18n";
import { categoryNames, courtNames } from "./reference";

const codes = (list: string[]) => (list.length ? `,${list.join(",")},` : ",");

/* ---------------------------------------------------------- quality score */

export async function recomputeQuality(pageId: number, preset?: { districtAvgViews?: number }): Promise<number> {
  const db = getDb();
  const [page] = await db.select().from(pages).where(eq(pages.id, pageId)).limit(1);
  if (!page) return 0;
  const yearAgo = new Date(Date.now() - 365 * 86400_000);
  const dayAgo = yearAgo.toISOString().slice(0, 10);
  const postRows = await db
    .select({ createdAt: posts.createdAt, type: posts.type })
    .from(posts)
    .where(and(eq(posts.pageId, pageId), eq(posts.status, "published"), isNull(posts.deletedAt), gte(posts.createdAt, yearAgo)));
  const [ev] = await db
    .select({ views: sql<number>`coalesce(sum(${pageDailyEvents.views}), 0)::int`, connects: sql<number>`coalesce(sum(${pageDailyEvents.connects}), 0)::int` })
    .from(pageDailyEvents)
    .where(and(eq(pageDailyEvents.pageId, pageId), gte(pageDailyEvents.day, dayAgo)));
  let districtAvg = preset?.districtAvgViews;
  if (districtAvg === undefined) {
    const [agg] = await db
      .select({ total: sql<number>`coalesce(sum(${pageDailyEvents.views}), 0)::int` })
      .from(pageDailyEvents)
      .innerJoin(pages, eq(pages.id, pageDailyEvents.pageId))
      .where(and(eq(pages.districtId, page.districtId), gte(pageDailyEvents.day, dayAgo)));
    const [cnt] = await db.select({ n: sql<number>`count(*)::int` }).from(pages).where(and(eq(pages.districtId, page.districtId), isNull(pages.deletedAt)));
    districtAvg = (agg?.total ?? 0) / Math.max(1, cnt?.n ?? 1);
  }
  const years = await yearsOf(page.id, page.type);
  const quality = computeQuality({
    completeness: page.completeness,
    posts: postRows.map((p) => ({ createdAt: p.createdAt, isCourtUpdate: p.type === "court_update" })),
    views: ev?.views ?? 0,
    connects: ev?.connects ?? 0,
    districtAvgViews: districtAvg ?? 0,
    years,
    lastActiveAt: page.lastActiveAt,
    createdAt: page.createdAt,
  });
  await db.update(pages).set({ score: quality }).where(eq(pages.id, pageId));
  await db.insert(pageScores).values({ pageId, quality }).onConflictDoUpdate({ target: pageScores.pageId, set: { quality, updatedAt: new Date() } });
  return quality;
}

async function yearsOf(pageId: number, type: string): Promise<number> {
  const db = getDb();
  if (type === "advocate") {
    const [a] = await db.select({ y: pageAdvocate.yearEnrolled }).from(pageAdvocate).where(eq(pageAdvocate.pageId, pageId)).limit(1);
    return yearsSince(a?.y);
  }
  const [f] = await db.select({ y: pageFirm.establishedYear }).from(pageFirm).where(eq(pageFirm.pageId, pageId)).limit(1);
  return yearsSince(f?.y);
}

/* ------------------------------------------------------ index maintenance */

async function chainCodes(localityId: number | null | undefined): Promise<string[]> {
  const db = getDb();
  const out: string[] = [];
  let cur = localityId ?? null;
  let guard = 0;
  while (cur && guard++ < 6) {
    const [l] = await db.select().from(localities).where(eq(localities.id, cur)).limit(1);
    if (!l) break;
    if (l.level !== "state" && l.level !== "district") out.push(l.code);
    cur = l.parentId;
  }
  return out;
}

/** Rebuild the page row and the office rows. Suspended or deleted pages are removed from search. */
export async function rebuildSearchIndex(pageId: number): Promise<void> {
  const db = getDb();
  await db.delete(searchIndex).where(eq(searchIndex.pageId, pageId));
  const [page] = await db.select().from(pages).where(and(eq(pages.id, pageId), isNull(pages.deletedAt))).limit(1);
  if (!page || page.status !== "active") return;
  const [district] = await db.select().from(localities).where(eq(localities.id, page.districtId)).limit(1);
  if (!district) return;

  const catRows = await db.select().from(pageCategories).where(and(eq(pageCategories.pageId, pageId), isNull(pageCategories.deletedAt))).orderBy(asc(pageCategories.sort), asc(pageCategories.id));
  const courtRows = await db.select().from(pageCourts).where(and(eq(pageCourts.pageId, pageId), isNull(pageCourts.deletedAt))).orderBy(asc(pageCourts.sort), asc(pageCourts.id));
  const visCats = visibleItems(page.plan, "categories", catRows);
  const visCourts = visibleItems(page.plan, "courts", courtRows);
  const catIds = visCats.map((c) => c.categoryId);
  const courtIds = visCourts.map((c) => c.courtId);
  const catInfo = catIds.length ? await db.select().from(categories).where(inArray(categories.id, catIds)) : [];
  const courtInfo = courtIds.length ? await db.select().from(courts).where(inArray(courts.id, courtIds)) : [];
  const catCode = new Map(catInfo.map((c) => [c.id, c]));
  const courtCode = new Map(courtInfo.map((c) => [c.id, c]));
  const catList = catIds.map((id) => catCode.get(id)).filter(Boolean) as typeof catInfo;
  const courtList = courtIds.map((id) => courtCode.get(id)).filter(Boolean) as typeof courtInfo;

  const langRows = await db.select().from(pageLanguages).where(and(eq(pageLanguages.pageId, pageId), isNull(pageLanguages.deletedAt))).orderBy(asc(pageLanguages.sort));
  const langs = [...new Set([...langRows.map((l) => l.languageCode), page.language])];

  const officeRows = await db.select().from(offices).where(and(eq(offices.pageId, pageId), isNull(offices.deletedAt))).orderBy(desc(offices.isMain), asc(offices.sort), asc(offices.id));
  const visOffices = visibleItems(page.plan, "offices", officeRows);
  const years = await yearsOf(pageId, page.type);
  const main = visOffices.find((o) => o.isMain) ?? visOffices[0];
  const lat = main?.lat ?? page.lat;
  const lng = main?.lng ?? page.lng;
  const locCodes = new Set<string>();
  for (const o of visOffices) for (const c of await chainCodes(o.localityId)) locCodes.add(c);

  const searchText = [page.name, page.bio ?? "", ...catList.map((c) => c.name), ...courtList.map((c) => c.name), district.name].join(" ").toLowerCase();
  const base = {
    pageId,
    districtCode: district.code,
    languageCodes: codes(langs),
    years,
    score: page.score,
    createdPage: page.createdAt,
    lastActive: page.lastActiveAt,
    indexable: true,
  };

  await db.insert(searchIndex).values({
    ...base,
    officeId: null,
    type: "page",
    kind: page.type,
    localityCodes: codes([...locCodes]),
    categoryCodes: codes(catList.map((c) => c.code)),
    courtCodes: codes(courtList.map((c) => c.code)),
    lat,
    lng,
    hasLocation: lat != null && lng != null,
    searchText,
  });

  for (const o of visOffices) {
    if (!o.about || !o.about.trim()) continue; // an office without its own description stays out of search
    const ocs = await db.select().from(officeCourts).where(and(eq(officeCourts.officeId, o.id), isNull(officeCourts.deletedAt))).orderBy(asc(officeCourts.sort));
    const focusInfo = ocs.length ? await db.select().from(courts).where(inArray(courts.id, ocs.map((c) => c.courtId))) : [];
    const focusOrdered = ocs.map((c) => focusInfo.find((f) => f.id === c.courtId)).filter(Boolean) as typeof focusInfo;
    const oLat = o.lat ?? lat;
    const oLng = o.lng ?? lng;
    await db.insert(searchIndex).values({
      ...base,
      officeId: o.id,
      type: "office",
      kind: "office",
      localityCodes: codes(await chainCodes(o.localityId)),
      categoryCodes: codes(catList.map((c) => c.code)),
      courtCodes: codes((focusOrdered.length ? focusOrdered : courtList).map((c) => c.code)),
      lat: oLat,
      lng: oLng,
      hasLocation: oLat != null && oLng != null,
      searchText: `${o.name} ${page.name} ${o.about} ${o.address ?? ""}`.toLowerCase(),
    });
  }
}

/* ----------------------------------------------------------------- search */

export interface SearchFilters {
  d?: string;
  q?: string;
  p?: string;
  c?: string;
  l?: string;
  g?: string;
  x?: number;
  t?: "advocate" | "firm" | "office";
  /** Visitor location (rounded); never stored. */
  near?: { lat: number; lng: number } | null;
  radiusKm?: number;
  firstPageId?: number | null;
  sort?: SortMode;
  excludePageId?: number;
}

const toCandidate = (r: typeof searchIndex.$inferSelect, name: string): Candidate => ({
  id: r.id,
  pageId: r.pageId,
  officeId: r.officeId,
  type: r.type as "page" | "office",
  kind: r.kind as Candidate["kind"],
  name,
  districtCode: r.districtCode,
  localityCodes: r.localityCodes,
  categoryCodes: r.categoryCodes,
  courtCodes: r.courtCodes,
  languageCodes: r.languageCodes,
  years: r.years,
  lat: r.lat,
  lng: r.lng,
  score: r.score,
  searchText: r.searchText,
  createdPage: r.createdPage,
});

const like = (col: any, code: string) => sql`${col} like ${`%,${escapeLike(code)},%`} escape '\\'`;

export async function searchCandidates(f: SearchFilters, limit = 1000): Promise<Candidate[]> {
  const db = getDb();
  const conds: any[] = [];
  if (f.d) conds.push(eq(searchIndex.districtCode, f.d));
  if (f.t === "office") conds.push(eq(searchIndex.type, "office"));
  else if (f.t) conds.push(eq(searchIndex.kind, f.t));
  else conds.push(eq(searchIndex.type, "page"));
  if (f.p) conds.push(like(searchIndex.categoryCodes, f.p));
  if (f.c) conds.push(like(searchIndex.courtCodes, f.c));
  if (f.l) conds.push(like(searchIndex.localityCodes, f.l));
  if (f.g) conds.push(like(searchIndex.languageCodes, f.g));
  if (f.x) conds.push(gte(searchIndex.years, f.x));
  if (f.q) conds.push(sql`${searchIndex.searchText} like ${`%${escapeLike(f.q.toLowerCase())}%`} escape '\\'`);
  if (f.excludePageId) conds.push(sql`${searchIndex.pageId} <> ${f.excludePageId}`);
  if (f.near && f.radiusKm) {
    // Bounding box first (cheap, indexed), exact distance afterwards in rank()
    const dLat = f.radiusKm / 111;
    const dLng = f.radiusKm / (111 * Math.max(0.2, Math.cos((f.near.lat * Math.PI) / 180)));
    conds.push(gte(searchIndex.lat, f.near.lat - dLat), lte(searchIndex.lat, f.near.lat + dLat), gte(searchIndex.lng, f.near.lng - dLng), lte(searchIndex.lng, f.near.lng + dLng));
  }
  const rows = await db
    .select({ r: searchIndex, name: pages.name, officeName: offices.name })
    .from(searchIndex)
    .innerJoin(pages, eq(pages.id, searchIndex.pageId))
    .leftJoin(offices, eq(offices.id, searchIndex.officeId))
    .where(and(...conds, eq(pages.status, "active"), isNull(pages.deletedAt)))
    .orderBy(desc(searchIndex.score), asc(searchIndex.id))
    .limit(limit);
  let out = rows.map((x) => toCandidate(x.r, x.officeName ? `${x.officeName} - ${x.name}` : x.name));
  if (f.near && f.radiusKm) out = out.filter((c) => c.lat == null || c.lng == null || haversineKm(f.near!, { lat: c.lat, lng: c.lng }) <= f.radiusKm!);
  return out;
}

export interface Card {
  key: string;
  pageId: number;
  officeId: number | null;
  kind: "advocate" | "firm" | "office";
  name: string;
  slug: string;
  photoKey: string | null;
  bio: string | null;
  categories: string[];
  district: string;
  years: number;
  hasContact: boolean;
  officeName?: string | null;
  address?: string | null;
  distanceKm?: number | null;
  isSource?: boolean;
  activeDomain?: string | null;
}

export async function hydrateCards(ranked: Ranked[], lang: Lang): Promise<Card[]> {
  if (!ranked.length) return [];
  const db = getDb();
  const pageIds = [...new Set(ranked.map((r) => r.c.pageId))];
  const prows = await db.select().from(pages).where(inArray(pages.id, pageIds));
  const pmap = new Map(prows.map((p) => [p.id, p]));
  const dmap = new Map((await db.select().from(localities).where(inArray(localities.id, [...new Set(prows.map((p) => p.districtId))]))).map((d) => [d.id, d]));
  const catLinks = await db.select().from(pageCategories).where(and(inArray(pageCategories.pageId, pageIds), isNull(pageCategories.deletedAt))).orderBy(asc(pageCategories.sort), asc(pageCategories.id));
  const names = await categoryNames(lang);
  const catByPage = new Map<number, number[]>();
  for (const l of catLinks) catByPage.set(l.pageId, [...(catByPage.get(l.pageId) ?? []), l.categoryId]);
  const officeIds = ranked.map((r) => r.c.officeId).filter((x): x is number => !!x);
  const orows = officeIds.length ? await db.select().from(offices).where(inArray(offices.id, officeIds)) : [];
  const omap = new Map(orows.map((o) => [o.id, o]));
  return ranked.map((r) => {
    const p = pmap.get(r.c.pageId)!;
    const o = r.c.officeId ? omap.get(r.c.officeId) : undefined;
    const limit = visibleItems(p.plan, "categories", (catByPage.get(p.id) ?? []).map((id, i) => ({ id, sort: i })));
    return {
      key: `${r.c.type}-${r.c.id}`,
      pageId: p.id,
      officeId: o?.id ?? null,
      kind: r.c.kind,
      name: p.name,
      slug: p.slug,
      photoKey: p.photoKey,
      bio: p.bio,
      categories: limit.map((x) => names.get(x.id) ?? "").filter(Boolean).slice(0, 4),
      district: dmap.get(p.districtId)?.name ?? "",
      years: r.c.years,
      hasContact: !!p.contactMobile,
      officeName: o?.name ?? null,
      address: o?.address ?? null,
      distanceKm: r.distanceKm,
      isSource: false,
    };
  });
}

export interface SearchResult {
  cards: Card[];
  total: number;
  capped: boolean;
  nextCursor: string | null;
  hasNextCourtUpdates?: boolean;
}

export const PAGE_SIZE = 10;

export async function runSearch(
  f: SearchFilters,
  opts: { cursor?: string | null; lang?: Lang; pageSize?: number; seedDay?: string } = {},
): Promise<SearchResult> {
  const candidates = await searchCandidates(f);
  const day = opts.seedDay ?? new Date().toISOString().slice(0, 10);
  const ctx: RankContext = { p: f.p, c: f.c, l: f.l, g: f.g, q: f.q, near: f.near ?? null, firstPageId: f.firstPageId ?? null, seed: `${day}:${f.d ?? "all"}` };
  const ranked = rank(candidates, ctx, f.sort ?? "relevance");
  const size = opts.pageSize ?? PAGE_SIZE;
  let start = 0;
  if (opts.cursor) {
    const id = Number(opts.cursor);
    const idx = ranked.findIndex((r) => r.c.id === id);
    start = idx >= 0 ? idx + 1 : 0;
  }
  const slice = ranked.slice(start, start + size);
  const cards = await hydrateCards(slice, opts.lang ?? "en");
  if (f.firstPageId) for (const c of cards) c.isSource = c.pageId === f.firstPageId;
  const nextCursor = start + size < ranked.length ? String(slice[slice.length - 1].c.id) : null;
  return { cards, total: ranked.length, capped: candidates.length >= 1000, nextCursor };
}

/** Basic pages show "Other advocates nearby" and "Similar advocates" (Professional/Premium hide these). */
export async function similarAndNearby(page: { id: number; districtId: number; lat: number | null; lng: number | null }, lang: Lang) {
  const db = getDb();
  const [district] = await db.select().from(localities).where(eq(localities.id, page.districtId)).limit(1);
  if (!district) return { nearby: [] as Card[], similar: [] as Card[] };
  const mine = await db.select({ code: categories.code }).from(pageCategories).innerJoin(categories, eq(categories.id, pageCategories.categoryId)).where(and(eq(pageCategories.pageId, page.id), isNull(pageCategories.deletedAt))).orderBy(asc(pageCategories.sort)).limit(1);
  const near = page.lat != null && page.lng != null ? { lat: page.lat, lng: page.lng } : null;
  const seed = new Date().toISOString().slice(0, 10);
  const nearbyAll = await searchCandidates({ d: district.code, t: "advocate", excludePageId: page.id, near });
  const nearbyRanked = rank(nearbyAll, { seed: `${seed}:near:${page.id}`, near }, near ? "nearest" : "relevance").slice(0, 3);
  const similarAll = mine[0] ? await searchCandidates({ d: district.code, t: "advocate", excludePageId: page.id, p: mine[0].code }) : [];
  const nearIds = new Set(nearbyRanked.map((r) => r.c.pageId));
  const similarRanked = rank(similarAll.filter((c) => !nearIds.has(c.pageId)), { seed: `${seed}:sim:${page.id}`, p: mine[0]?.code }).slice(0, 3);
  return { nearby: await hydrateCards(nearbyRanked, lang), similar: await hydrateCards(similarRanked, lang) };
}

export async function newlyJoinedForCourt(courtCode: string, limit = 10, lang: Lang = "en"): Promise<Card[]> {
  const db = getDb();
  const rows = await db
    .select({ r: searchIndex, name: pages.name })
    .from(searchIndex)
    .innerJoin(pages, eq(pages.id, searchIndex.pageId))
    .where(and(eq(searchIndex.type, "page"), like(searchIndex.courtCodes, courtCode), eq(pages.status, "active"), isNull(pages.deletedAt)))
    .orderBy(desc(searchIndex.createdPage))
    .limit(limit);
  const ranked: Ranked[] = rows.map((x) => ({ c: toCandidate(x.r, x.name), total: 0, distanceKm: null }));
  return hydrateCards(ranked, lang);
}

export async function countIndexed(filters: { d?: string; p?: string; c?: string; l?: string }): Promise<number> {
  const conds: any[] = [eq(searchIndex.type, "page")];
  if (filters.d) conds.push(eq(searchIndex.districtCode, filters.d));
  if (filters.p) conds.push(like(searchIndex.categoryCodes, filters.p));
  if (filters.c) conds.push(like(searchIndex.courtCodes, filters.c));
  if (filters.l) conds.push(like(searchIndex.localityCodes, filters.l));
  const [r] = await getDb().select({ n: sql<number>`count(*)::int` }).from(searchIndex).where(and(...conds));
  return r?.n ?? 0;
}

export async function rebuildAllIndexes(): Promise<number> {
  const db = getDb();
  const ids = await db.select({ id: pages.id }).from(pages).where(isNull(pages.deletedAt));
  for (const { id } of ids) await rebuildSearchIndex(id);
  return ids.length;
}


