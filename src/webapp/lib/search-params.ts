import type { SortMode } from "./ranking";
import { SORT_MODES } from "./ranking";
import type { SearchParams } from "./url";
import { cookies } from "next/headers";
import { NEAR_COOKIE } from "./session";
import type { SearchFilters } from "@/repo/search";

type Raw = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const code = (v: string | undefined) => (v && /^[a-z0-9]{2,12}$/.test(v) ? v : undefined);

/** Parse and validate the short-code query string. */
export function parseSearchParams(raw: Raw): SearchParams {
  const x = Number(one(raw.x));
  const page = Number(one(raw.page));
  const sort = one(raw.s);
  const t = one(raw.t);
  return {
    d: code(one(raw.d)),
    q: one(raw.q)?.trim().slice(0, 60) || undefined,
    p: code(one(raw.p)) ?? undefined,
    c: code(one(raw.c)),
    l: code(one(raw.l)),
    g: one(raw.g) && /^[a-z]{2,3}$/.test(one(raw.g)!) ? one(raw.g) : undefined,
    x: Number.isFinite(x) && x > 0 ? String(Math.min(40, Math.floor(x))) : undefined,
    t: t === "advocate" || t === "firm" || t === "office" ? t : undefined,
    s: sort && (SORT_MODES as string[]).includes(sort) ? sort : undefined,
    n: one(raw.n) === "1" ? "1" : undefined,
    first: /^\d+$/.test(one(raw.first) ?? "") ? one(raw.first) : undefined,
    after: /^\d+$/.test(one(raw.after) ?? "") ? one(raw.after) : undefined,
    page: Number.isInteger(page) && page > 1 && page < 1000 ? String(page) : undefined,
  };
}

/** Rounded position from the essential near-me cookie (session length; never stored server side). */
export async function readNear(): Promise<{ lat: number; lng: number } | null> {
  const v = (await cookies()).get(NEAR_COOKIE)?.value;
  const m = v?.match(/^(-?\d{1,2}\.\d{1,2}),(-?\d{1,3}\.\d{1,2})$/);
  return m ? { lat: Number(m[1]), lng: Number(m[2]) } : null;
}

export async function toFilters(p: SearchParams): Promise<SearchFilters> {
  const near = p.n ? await readNear() : null;
  return {
    d: p.d, q: p.q, p: p.p, c: p.c, l: p.l, g: p.g,
    x: p.x ? Number(p.x) : undefined,
    t: p.t as SearchFilters["t"],
    near,
    firstPageId: p.first ? Number(p.first) : null,
    sort: (p.s as SortMode) ?? (near && p.n ? "nearest" : "relevance"),
  };
}

/** True when the URL carries anything beyond the clean path (filters, sort, cursor, page). */
export function hasExtraParams(p: SearchParams, ignore: (keyof SearchParams)[] = []): boolean {
  return (Object.keys(p) as (keyof SearchParams)[]).some((k) => !ignore.includes(k) && p[k] !== undefined);
}

/** Query params to preserve on pagination links. */
export function paramsForLinks(p: SearchParams): Record<string, string | undefined> {
  const { after, page, ...rest } = p;
  void after; void page;
  return rest as Record<string, string | undefined>;
}
