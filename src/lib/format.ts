import type { Lang } from "./i18n";

export function formatDate(d: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "ml" ? "ml-IN" : "en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(d);
}

export const isoDate = (d: Date) => d.toISOString();
