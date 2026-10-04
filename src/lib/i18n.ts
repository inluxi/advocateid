import en from "../messages/en.json";
import ml from "../messages/ml.json";

export type Lang = "en" | "ml";
export const LANGS: Lang[] = ["en", "ml"];
export const DEFAULT_LANG: Lang = "en";

type Dict = Record<string, string>;
const DICTS: Record<Lang, Dict> = { en: en as Dict, ml: ml as Dict };

export function isLang(v: unknown): v is Lang {
  return v === "en" || v === "ml";
}

export type TFunction = (key: string, vars?: Record<string, string | number>) => string;

/** UI text comes only from translation files. Missing Malayalam keys fall back to English. */
export function makeT(lang: Lang): TFunction {
  return (key, vars) => {
    const raw = DICTS[lang][key] ?? DICTS.en[key] ?? key;
    return vars ? raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`)) : raw;
  };
}

/** Pick a localised name from a base value, a local_name column or a translation row. */
export function localName(lang: Lang, name: string, local?: string | null): string {
  return lang === "ml" && local ? local : name;
}
