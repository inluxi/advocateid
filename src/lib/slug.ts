/** Page address (slug) rules: D9 in requirements v6. */

export const SLUG_MIN = 5;
export const SLUG_MAX = 30;
export const SLUG_CHANGE_DAYS = 90;
export const SLUG_REDIRECT_DAYS = 365; // old slug redirects 12 months
export const SLUG_RESERVE_DAYS = 90; // deleted slug reserved 90 days

export const RESERVED_SLUGS = new Set([
  "c", "l", "u", "d", "o", "p", "post", "posts", "practice", "compare", "search", "login", "logout", "account",
  "manage", "admin", "api", "pricing", "about", "contact", "terms", "privacy", "grievance", "report", "sitemap",
  "sitemaps", "robots", "lawyers", "offices", "ml", "connect", "static", "uploads", "manifest", "offline", "favicon",
  "advocateid", "advocate", "advocates", "firm", "firms", "support", "help", "www", "mail", "app", "assets", "images",
  "domain", "domains", "home", "index", "new", "edit", "settings", "bookmarks", "download", "updates", "update",
]);

export type SlugCheck = { ok: true } | { ok: false; reason: "length" | "chars" | "hyphen" | "reserved" };

export function checkSlug(slug: string): SlugCheck {
  if (slug.length < SLUG_MIN || slug.length > SLUG_MAX) return { ok: false, reason: "length" };
  if (!/^[a-z0-9-]+$/.test(slug)) return { ok: false, reason: "chars" };
  if (slug.startsWith("-") || slug.endsWith("-") || slug.includes("--")) return { ok: false, reason: "hyphen" };
  if (RESERVED_SLUGS.has(slug)) return { ok: false, reason: "reserved" };
  return { ok: true };
}

/** Suggest a slug from a name (ASCII only). */
export function suggestSlug(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");
  return base.length >= SLUG_MIN ? base : (base + "-advocate").slice(0, SLUG_MAX).replace(/^-+/, "");
}

export function canChangeSlug(lastChangedAt: Date | null | undefined, now = new Date()): { ok: boolean; nextAllowed?: Date } {
  if (!lastChangedAt) return { ok: true };
  const next = new Date(lastChangedAt.getTime() + SLUG_CHANGE_DAYS * 86400_000);
  return now >= next ? { ok: true } : { ok: false, nextAllowed: next };
}

export const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86400_000);
