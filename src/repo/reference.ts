import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  categories,
  categoryTranslations,
  courtDetails,
  courtTranslations,
  courts,
  localities,
} from "@/db/schema";
import { csvToObjects } from "@/lib/csv";
import type { Lang } from "@/lib/i18n";
import { escapeLike } from "@/lib/text";

export type Locality = typeof localities.$inferSelect;
export type Court = typeof courts.$inferSelect;
export type Category = typeof categories.$inferSelect;

const live = <T extends { deletedAt: any }>(t: T) => isNull(t.deletedAt);

/* -------------------------------------------------------------- localities */

export async function listDistricts(): Promise<Locality[]> {
  return getDb().select().from(localities).where(and(eq(localities.level, "district"), live(localities))).orderBy(asc(localities.name));
}

export async function getLocality(id: number): Promise<Locality | null> {
  const r = await getDb().select().from(localities).where(and(eq(localities.id, id), live(localities))).limit(1);
  return r[0] ?? null;
}

export async function getLocalityByCode(code: string): Promise<Locality | null> {
  const r = await getDb().select().from(localities).where(and(eq(localities.code, code), live(localities))).limit(1);
  return r[0] ?? null;
}

export async function listChildLocalities(parentId: number): Promise<Locality[]> {
  return getDb().select().from(localities).where(and(eq(localities.parentId, parentId), live(localities))).orderBy(asc(localities.sort), asc(localities.name));
}

/** All localities inside a district (cities and areas), for filters. */
export async function listDistrictLocalities(districtId: number): Promise<Locality[]> {
  const direct = await listChildLocalities(districtId);
  const ids = direct.map((l) => l.id);
  const nested = ids.length
    ? await getDb().select().from(localities).where(and(inArray(localities.parentId, ids), live(localities))).orderBy(asc(localities.name))
    : [];
  return [...direct, ...nested];
}

/** Chain from a locality up to its district (self first). */
export async function localityChain(id: number | null | undefined): Promise<Locality[]> {
  const out: Locality[] = [];
  let cur = id ? await getLocality(id) : null;
  let guard = 0;
  while (cur && guard++ < 6) {
    out.push(cur);
    cur = cur.parentId ? await getLocality(cur.parentId) : null;
  }
  return out;
}

export async function searchLocalities(q: string, limit = 20): Promise<Locality[]> {
  const pat = `%${escapeLike(q.toLowerCase())}%`;
  return getDb()
    .select()
    .from(localities)
    .where(and(live(localities), sql`lower(${localities.name}) like ${pat} escape '\\'`))
    .orderBy(asc(localities.name))
    .limit(limit);
}

/* -------------------------------------------------------------- categories */

export async function listCategories(): Promise<Category[]> {
  return getDb().select().from(categories).where(live(categories)).orderBy(asc(categories.sort), asc(categories.name));
}

export async function getCategoryBySlugOrCode(v: string): Promise<Category | null> {
  const r = await getDb()
    .select()
    .from(categories)
    .where(and(live(categories), sql`(${categories.slug} = ${v} or ${categories.code} = ${v})`))
    .limit(1);
  return r[0] ?? null;
}

export async function getCategory(id: number): Promise<Category | null> {
  const r = await getDb().select().from(categories).where(and(eq(categories.id, id), live(categories))).limit(1);
  return r[0] ?? null;
}

export async function categoryNames(lang: Lang): Promise<Map<number, string>> {
  const db = getDb();
  const base = await db.select({ id: categories.id, name: categories.name }).from(categories);
  const map = new Map(base.map((c) => [c.id, c.name]));
  if (lang !== "en") {
    const tr = await db.select().from(categoryTranslations).where(eq(categoryTranslations.language, lang));
    for (const t of tr) map.set(t.categoryId, t.name);
  }
  return map;
}

export function categoryName(c: Category, names: Map<number, string>): string {
  return names.get(c.id) ?? c.name;
}

/* ------------------------------------------------------------------ courts */

export async function getCourt(id: number): Promise<Court | null> {
  const r = await getDb().select().from(courts).where(and(eq(courts.id, id), live(courts))).limit(1);
  return r[0] ?? null;
}

export async function getCourtByCode(code: string): Promise<Court | null> {
  const r = await getDb().select().from(courts).where(and(eq(courts.code, code), live(courts))).limit(1);
  return r[0] ?? null;
}

export async function getCourtsByIds(ids: number[]): Promise<Court[]> {
  if (!ids.length) return [];
  return getDb().select().from(courts).where(and(inArray(courts.id, ids), live(courts)));
}

export async function listCourts(opts: { districtId?: number; q?: string; limit?: number; offset?: number } = {}): Promise<Court[]> {
  const conds = [live(courts)];
  if (opts.districtId) conds.push(eq(courts.districtId, opts.districtId));
  if (opts.q) {
    const pat = `%${escapeLike(opts.q.toLowerCase())}%`;
    conds.push(sql`(lower(${courts.name}) like ${pat} escape '\\' or lower(coalesce(${courts.localName}, '')) like ${pat} escape '\\')`);
  }
  return getDb()
    .select()
    .from(courts)
    .where(and(...conds))
    .orderBy(asc(courts.name))
    .limit(opts.limit ?? 50)
    .offset(opts.offset ?? 0);
}

export async function countCourts(): Promise<number> {
  const r = await getDb().select({ n: sql<number>`count(*)::int` }).from(courts).where(live(courts));
  return r[0]?.n ?? 0;
}

export async function getCourtDetails(courtId: number) {
  return getDb().select().from(courtDetails).where(and(eq(courtDetails.courtId, courtId), live(courtDetails))).orderBy(asc(courtDetails.sort));
}

export async function courtNames(lang: Lang, ids?: number[]): Promise<Map<number, string>> {
  const db = getDb();
  const rows = await db.select({ id: courts.id, name: courts.name, localName: courts.localName }).from(courts);
  const map = new Map<number, string>();
  for (const r of rows) if (!ids || ids.includes(r.id)) map.set(r.id, lang === "ml" && r.localName ? r.localName : r.name);
  if (lang !== "en") {
    const tr = await db.select().from(courtTranslations).where(eq(courtTranslations.language, lang));
    for (const t of tr) if (!ids || ids.includes(t.courtId)) map.set(t.courtId, t.name);
  }
  return map;
}

export async function updateCourt(
  id: number,
  data: Partial<Pick<Court, "name" | "localName" | "kind" | "address" | "pincode" | "lat" | "lng" | "website">>,
  details?: { keyName: string; value: string }[],
): Promise<void> {
  const db = getDb();
  await db.update(courts).set({ ...data, updatedAt: new Date() }).where(eq(courts.id, id));
  if (details) {
    await db.update(courtDetails).set({ deletedAt: new Date(), deletedBy: "admin" }).where(and(eq(courtDetails.courtId, id), isNull(courtDetails.deletedAt)));
    if (details.length) {
      await db.insert(courtDetails).values(details.map((d, i) => ({ courtId: id, sort: i, keyName: d.keyName, value: d.value })));
    }
  }
}

/* -------------------------------------------------------- CSV court import */

export const COURT_CSV_COLUMNS = [
  "id", "name", "local_name", "kind", "state", "district_code", "city", "locality", "address", "pincode", "latitude", "longitude",
] as const;

export interface ImportResult {
  inserted: number;
  updated: number;
  localitiesCreated: number;
  errors: { row: number; message: string }[];
  warnings: string[];
}

const toCode = (s: string, max = 6) => s.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, max);

async function ensureLocality(
  cache: Map<string, Locality>,
  counters: { created: number },
  opts: { name: string; level: Locality["level"]; parentId: number | null; code?: string; lat?: number | null; lng?: number | null },
): Promise<Locality> {
  const db = getDb();
  const key = `${opts.level}:${opts.parentId ?? 0}:${opts.name.toLowerCase()}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const existing = await db
    .select()
    .from(localities)
    .where(and(eq(localities.level, opts.level), sql`lower(${localities.name}) = ${opts.name.toLowerCase()}`, opts.parentId ? eq(localities.parentId, opts.parentId) : isNull(localities.parentId)))
    .limit(1);
  if (existing[0]) {
    cache.set(key, existing[0]);
    return existing[0];
  }
  let code = opts.code ?? toCode(opts.name, 5);
  if (code.length < 2) code = `${code}x`.padEnd(2, "x");
  for (let n = 0; ; n++) {
    const candidate = n === 0 ? code : `${code.slice(0, 5)}${n.toString(36)}`.slice(0, 8);
    const clash = await db.select({ id: localities.id }).from(localities).where(eq(localities.code, candidate)).limit(1);
    if (!clash[0]) {
      code = candidate;
      break;
    }
  }
  const [row] = await db
    .insert(localities)
    .values({ code, name: opts.name, level: opts.level, parentId: opts.parentId, lat: opts.lat ?? null, lng: opts.lng ?? null })
    .returning();
  counters.created++;
  cache.set(key, row);
  return row;
}

/** Admin CSV upload: validate the whole file first, then upsert by the `id` column. */
export async function importCourtsCsv(text: string): Promise<ImportResult> {
  const { headers, rows } = csvToObjects(text);
  const result: ImportResult = { inserted: 0, updated: 0, localitiesCreated: 0, errors: [], warnings: [] };
  const missing = COURT_CSV_COLUMNS.filter((c) => !headers.includes(c) && !["local_name", "locality", "address", "pincode", "latitude", "longitude"].includes(c));
  if (missing.length) {
    result.errors.push({ row: 0, message: `Missing required columns: ${missing.join(", ")}` });
    return result;
  }

  // Validation pass
  const seenKeys = new Set<string>();
  const seenNames = new Set<string>();
  rows.forEach((r, i) => {
    const row = i + 2;
    if (!r.id) result.errors.push({ row, message: "id is required" });
    if (!r.name) result.errors.push({ row, message: "name is required" });
    if (!r.kind) result.errors.push({ row, message: "kind is required" });
    if (!r.district_code || toCode(r.district_code, 8).length < 2) result.errors.push({ row, message: "district_code must have 2 to 8 letters or digits" });
    if (!r.city) result.errors.push({ row, message: "city is required" });
    for (const f of ["latitude", "longitude"] as const) {
      if (r[f] && Number.isNaN(Number(r[f]))) result.errors.push({ row, message: `${f} must be a number` });
    }
    if (r.latitude && (Number(r.latitude) < 6 || Number(r.latitude) > 38)) result.errors.push({ row, message: "latitude is outside India" });
    if (r.longitude && (Number(r.longitude) < 67 || Number(r.longitude) > 98)) result.errors.push({ row, message: "longitude is outside India" });
    if (r.id) {
      if (seenKeys.has(r.id)) result.errors.push({ row, message: `duplicate id ${r.id}` });
      seenKeys.add(r.id);
    }
    const nameKey = `${r.district_code}|${r.name}`.toLowerCase();
    if (r.name) {
      if (seenNames.has(nameKey)) result.errors.push({ row, message: `duplicate court name "${r.name}" in the same district` });
      seenNames.add(nameKey);
    }
  });
  if (result.errors.length) return result;

  const db = getDb();
  const cache = new Map<string, Locality>();
  const counters = { created: 0 };
  for (const r of rows) {
    const state = await ensureLocality(cache, counters, { name: r.state || "India", level: "state", parentId: null });
    const districtCode = toCode(r.district_code, 8);
    let district = (await db.select().from(localities).where(eq(localities.code, districtCode)).limit(1))[0];
    if (!district) {
      district = await ensureLocality(cache, counters, { name: r.city, level: "district", parentId: state.id, code: districtCode });
      result.warnings.push(`District code "${districtCode}" did not exist; created as "${r.city}"`);
    }
    const city = await ensureLocality(cache, counters, { name: r.city, level: r.city.toLowerCase() === district.name.toLowerCase() ? "district" : "city", parentId: r.city.toLowerCase() === district.name.toLowerCase() ? state.id : district.id });
    const area = r.locality && r.locality.toLowerCase() !== r.city.toLowerCase()
      ? await ensureLocality(cache, counters, { name: r.locality, level: "locality", parentId: city.id })
      : city;
    const lat = r.latitude ? Number(r.latitude) : null;
    const lng = r.longitude ? Number(r.longitude) : null;
    const values = {
      name: r.name,
      localName: r.local_name || null,
      kind: r.kind,
      localityId: area.id,
      districtId: district.id,
      address: r.address || null,
      pincode: r.pincode || null,
      lat,
      lng,
      updatedAt: new Date(),
    };
    const existing = await db.select({ id: courts.id }).from(courts).where(eq(courts.importKey, r.id)).limit(1);
    if (existing[0]) {
      await db.update(courts).set({ ...values, deletedAt: null, deletedBy: null }).where(eq(courts.id, existing[0].id));
      result.updated++;
    } else {
      const [row] = await db.insert(courts).values({ ...values, code: `t${Math.random().toString(36).slice(2, 8)}`, importKey: r.id }).returning({ id: courts.id });
      await db.update(courts).set({ code: `c${row.id.toString(36)}` }).where(eq(courts.id, row.id));
      result.inserted++;
    }
  }
  result.localitiesCreated = counters.created;
  return result;
}

