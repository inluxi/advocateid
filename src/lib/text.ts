/** Small text helpers shared by SEO, URLs and forms. */

export function seoSlug(text: string, max = 60): string {
  const s = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/g, "");
  return s || "item";
}

export function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "");
}

export function truncate(s: string, n: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= n ? t : t.slice(0, n - 1).trimEnd() + "…";
}

export function metaDescription(...candidates: (string | null | undefined)[]): string {
  const text = candidates.find((c) => c && c.trim()) ?? "";
  return truncate(stripHtml(text), 160);
}

export function yearsSince(year: number | null | undefined, now = new Date()): number {
  if (!year) return 0;
  return Math.max(0, now.getUTCFullYear() - year);
}

/** Escape for use inside a LIKE pattern (we use ESCAPE '\'). */
export function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export const isHttpUrl = (s: string): boolean => {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};
