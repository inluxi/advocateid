/**
 * Ranking model v6 section 10:
 *   Score = 0.45 x Relevance + 0.25 x Nearness + 0.30 x Quality
 * Plan NEVER enters any calculation here. Scores are never shown to visitors.
 * Everything in this file is pure so it can be unit tested.
 */

export interface Candidate {
  id: number; // search_index id
  pageId: number;
  officeId: number | null;
  type: "page" | "office";
  kind: "advocate" | "firm" | "office";
  name: string;
  districtCode: string;
  localityCodes: string; // ",a,b," in owner order
  categoryCodes: string;
  courtCodes: string;
  languageCodes: string;
  years: number;
  lat: number | null;
  lng: number | null;
  score: number; // Quality 0..100 (nightly)
  searchText: string;
  createdPage: Date;
}

export interface RankContext {
  p?: string; // practice code
  c?: string; // court code
  l?: string; // locality code
  g?: string; // language code
  q?: string;
  near?: { lat: number; lng: number } | null;
  firstPageId?: number | null;
  seed: string; // changes daily: YYYY-MM-DD + district
}

export type SortMode = "relevance" | "nearest" | "experience" | "newest";
export const SORT_MODES: SortMode[] = ["relevance", "nearest", "experience", "newest"];

export const W_RELEVANCE = 0.45;
export const W_NEARNESS = 0.25;
export const W_QUALITY = 0.3;
export const SOURCE_BOOST = 1000;

const codesOf = (s: string) => s.split(",").filter(Boolean);

function positional(codes: string, wanted: string | undefined, max: number): number {
  if (!wanted) return max;
  const idx = codesOf(codes).indexOf(wanted);
  if (idx < 0) return 0;
  return max * (1 - 0.1 * Math.min(idx, 5)); // first-listed area counts most
}

export function relevance(c: Candidate, ctx: RankContext): number {
  const practice = positional(c.categoryCodes, ctx.p, 40);
  const court = positional(c.courtCodes, ctx.c, 25);
  const language = ctx.g ? (codesOf(c.languageCodes).includes(ctx.g) ? 10 : 0) : 10;
  let text = 15;
  if (ctx.q) {
    const q = ctx.q.toLowerCase();
    const name = c.name.toLowerCase();
    text = name.startsWith(q) ? 15 : name.includes(q) ? 12 : c.searchText.includes(q) ? 8 : 0;
  }
  const location = ctx.l ? (codesOf(c.localityCodes).includes(ctx.l) ? 10 : 0) : 10;
  return practice + court + language + text + location;
}

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function distanceKm(c: Candidate, ctx: RankContext): number | null {
  if (!ctx.near || c.lat == null || c.lng == null) return null;
  return haversineKm(ctx.near, { lat: c.lat, lng: c.lng });
}

export function nearness(c: Candidate, ctx: RankContext): number {
  const d = distanceKm(c, ctx);
  if (d != null) {
    if (d <= 2) return 100;
    if (d <= 10) return 85;
    if (d <= 25) return 65;
    if (d <= 50) return 45;
    if (d <= 100) return 25;
    return 10;
  }
  if (ctx.l && codesOf(c.localityCodes).includes(ctx.l)) return 100; // same locality
  return 45; // same district (district is always required)
}

export function totalScore(c: Candidate, ctx: RankContext): number {
  let s = W_RELEVANCE * relevance(c, ctx) + W_NEARNESS * nearness(c, ctx) + W_QUALITY * c.score;
  if (ctx.firstPageId && c.pageId === ctx.firstPageId) s += SOURCE_BOOST;
  return s;
}

/* ----------------------------------------------------------- fairness */

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Profiles within 5 points of each other are shuffled (daily seed). */
export function shuffleTies<T extends { total: number }>(sorted: T[], seed: string, band = 5): T[] {
  const rand = mulberry32(hashSeed(seed));
  const out: T[] = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i + 1;
    while (j < sorted.length && sorted[i].total - sorted[j].total <= band && sorted[i].total < SOURCE_BOOST) j++;
    const group = sorted.slice(i, j);
    for (let k = group.length - 1; k > 0; k--) {
      const r = Math.floor(rand() * (k + 1));
      [group[k], group[r]] = [group[r], group[k]];
    }
    out.push(...group);
    i = j;
  }
  return out;
}

/** No firm takes more than `max` consecutive slots (a firm and its offices count as one). */
export function capConsecutive<T extends { c: Candidate }>(items: T[], max = 2): T[] {
  const remaining = [...items];
  const out: T[] = [];
  const key = (x: T) => x.c.pageId;
  while (remaining.length) {
    let pick = -1;
    for (let i = 0; i < remaining.length; i++) {
      const last = out.slice(-max);
      const blocked = last.length === max && last.every((l) => key(l) === key(remaining[i]));
      if (!blocked) {
        pick = i;
        break;
      }
    }
    if (pick < 0) pick = 0;
    out.push(remaining.splice(pick, 1)[0]);
  }
  return out;
}

export interface Ranked {
  c: Candidate;
  total: number;
  distanceKm: number | null;
}

export function rank(candidates: Candidate[], ctx: RankContext, sort: SortMode = "relevance"): Ranked[] {
  const scored: Ranked[] = candidates.map((c) => ({ c, total: totalScore(c, ctx), distanceKm: distanceKm(c, ctx) }));
  const byId = (a: Ranked, b: Ranked) => a.c.id - b.c.id;
  if (sort === "nearest" && ctx.near) {
    return scored.sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9) || byId(a, b));
  }
  if (sort === "experience") return scored.sort((a, b) => b.c.years - a.c.years || b.total - a.total || byId(a, b));
  if (sort === "newest") return scored.sort((a, b) => b.c.createdPage.getTime() - a.c.createdPage.getTime() || byId(a, b));
  scored.sort((a, b) => b.total - a.total || byId(a, b));
  return capConsecutive(shuffleTies(scored, ctx.seed));
}

/* ------------------------------------------------------ quality (nightly) */

export interface QualityInput {
  completeness: number; // 0..100
  posts: { createdAt: Date; isCourtUpdate: boolean }[]; // last 12 months
  views: number; // cleaned, 12 months
  connects: number; // cleaned, 12 months
  districtAvgViews: number; // average cleaned views for same district + category
  years: number;
  lastActiveAt: Date;
  createdAt: Date;
  now?: Date;
}

const DAY = 86400_000;
const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

export function contentScore(posts: QualityInput["posts"], now: Date): number {
  let sum = 0;
  for (const p of posts) {
    const age = (now.getTime() - p.createdAt.getTime()) / DAY;
    if (age > 365) continue;
    const w = age <= 90 ? 1 : age <= 180 ? 0.75 : 0.5; // newer counts more
    sum += w * (p.isCourtUpdate ? 1.5 : 1); // court updates count extra
  }
  return clamp(sum * 20);
}

/** Smoothed so zero visits is neutral (50), large numbers are capped, compared with the same district and category. */
export function engagementScore(views: number, connects: number, districtAvg: number): number {
  const m = 10;
  const activity = views + 3 * connects;
  const ratio = Math.min(2, (activity + m) / (Math.max(0, districtAvg) + m));
  return clamp(50 * ratio);
}

export function freshnessScore(lastActiveAt: Date, now: Date): number {
  const d = (now.getTime() - lastActiveAt.getTime()) / DAY;
  return d <= 30 ? 100 : d <= 90 ? 70 : d <= 180 ? 40 : d <= 365 ? 20 : 0;
}

export function newProfileBoost(createdAt: Date, now: Date): number {
  const d = (now.getTime() - createdAt.getTime()) / DAY;
  return clamp((1 - d / 30) * 100);
}

export function computeQuality(i: QualityInput): number {
  const now = i.now ?? new Date();
  const parts =
    0.25 * clamp(i.completeness) +
    0.25 * contentScore(i.posts, now) +
    0.2 * engagementScore(i.views, i.connects, i.districtAvgViews) +
    0.1 * clamp((Math.min(i.years, 25) / 25) * 100) +
    0.1 * freshnessScore(i.lastActiveAt, now) +
    0.1 * newProfileBoost(i.createdAt, now);
  return Math.round(parts * 100) / 100;
}
