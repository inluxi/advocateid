import { headers } from "next/headers";
import { DEFAULT_LANG, isLang, makeT, type Lang, type TFunction } from "./i18n";

/** Language comes from the URL prefix (/ml/...), set as x-lang by proxy.ts. Never from the browser. */
export async function getLang(): Promise<Lang> {
  const v = (await headers()).get("x-lang");
  return isLang(v) ? v : DEFAULT_LANG;
}

export async function getCurrentPath(): Promise<string> {
  return (await headers()).get("x-path") ?? "/";
}

export async function getT(): Promise<{ lang: Lang; t: TFunction }> {
  const lang = await getLang();
  return { lang, t: makeT(lang) };
}
