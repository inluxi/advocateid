import enCommon from "../messages/en/common.json";
import enPublic from "../messages/en/public.json";
import enProfile from "../messages/en/profile.json";
import enManage from "../messages/en/manage.json";
import enAccount from "../messages/en/account.json";
import enAdmin from "../messages/en/admin.json";
import enLegal from "../messages/en/legal.json";
import mlCommon from "../messages/ml/common.json";

export type Lang = "en" | "ml";
export const LANGS: Lang[] = ["en", "ml"];
export const DEFAULT_LANG: Lang = "en";

type Dict = Record<string, string>;

/** All UI text lives in messages/. UI stays English until MVP 2; Malayalam falls back key by key. */
export const EN: Dict = { ...enCommon, ...enPublic, ...enProfile, ...enManage, ...enAccount, ...enAdmin, ...enLegal };
const DICTS: Record<Lang, Dict> = { en: EN, ml: mlCommon as Dict };

export function isLang(v: unknown): v is Lang {
  return v === "en" || v === "ml";
}

export type TFunction = (key: string, vars?: Record<string, string | number>) => string;

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
