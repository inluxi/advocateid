import { config } from "./config";
import type { Lang } from "./i18n";
import { seoSlug } from "./text";

/** Prefix a path with the language segment (/ml/...). English has no prefix. */
export function withLang(path: string, lang: Lang): string {
  if (lang === "en") return path;
  return path === "/" ? "/ml" : `/ml${path}`;
}

export const absolute = (path: string) => `${config.siteOrigin}${path}`;

export const courtPath = (c: { id: number; name: string }, lang: Lang = "en") => withLang(`/c/${c.id}/${seoSlug(c.name)}`, lang);
export const courtUpdatesPath = (c: { id: number; name: string }, lang: Lang = "en") => `${courtPath(c, lang)}/updates`;
export const courtPracticePath = (c: { id: number; name: string }, practiceSlug: string, lang: Lang = "en") =>
  `${courtPath(c, lang)}/${practiceSlug}`;
export const updatePath = (u: { id: number; title: string }, lang: Lang = "en") => withLang(`/u/${u.id}/${seoSlug(u.title)}`, lang);
export const locationPath = (l: { id: number; name: string }, lang: Lang = "en") => withLang(`/l/${l.id}/${seoSlug(l.name)}`, lang);
export const locationPracticePath = (l: { id: number; name: string }, practiceSlug: string, lang: Lang = "en") =>
  `${locationPath(l, lang)}/${practiceSlug}`;
export const districtPath = (code: string, lang: Lang = "en") => withLang(`/d/${code}`, lang);
export const districtPracticePath = (code: string, practiceSlug: string, lang: Lang = "en") =>
  withLang(`/d/${code}/practice-area/${practiceSlug}`, lang);
export const practiceIndexPath = (lang: Lang = "en") => withLang("/practice", lang);
export const practicePath = (slug: string, lang: Lang = "en") => withLang(`/practice/${slug}`, lang);
export const postPath = (p: { id: number; title: string }, lang: Lang = "en") => withLang(`/post/${p.id}/${seoSlug(p.title)}`, lang);
export const profilePath = (slug: string, lang: Lang = "en") => withLang(`/${slug}`, lang);
export const officePath = (slug: string, o: { id: number; name: string }, lang: Lang = "en") =>
  withLang(`/${slug}/o/${o.id}/${seoSlug(o.name)}`, lang);

/** Query-string search URL with short codes (always noindex). */
export interface SearchParams {
  d?: string; // district code
  q?: string;
  p?: string; // practice code
  c?: string; // court code
  l?: string; // locality code
  g?: string; // language
  x?: string; // min years of experience
  t?: string; // advocate | firm | office
  s?: string; // relevance | nearest | experience | newest
  n?: string; // "1" = near me (coordinates live in an essential cookie, never in the URL)
  first?: string; // page id shown first (practice-area click)
  after?: string; // keyset cursor
  page?: string;
}

export function searchUrl(params: SearchParams, lang: Lang = "en"): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
  const s = qs.toString();
  return withLang(`/search${s ? `?${s}` : ""}`, lang);
}

/** Base address of a page for sharing (premium with an active domain uses its own domain). */
export function pageAddress(page: { slug: string }, activeDomain?: string | null): string {
  return activeDomain ? `https://${activeDomain}/` : absolute(`/${page.slug}`);
}
