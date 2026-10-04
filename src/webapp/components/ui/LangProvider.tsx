"use client";
import { createContext, useContext } from "react";
import { makeT, type Lang, type TFunction } from "@/lib/i18n";

const Ctx = createContext<Lang>("en");

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <Ctx.Provider value={lang}>{children}</Ctx.Provider>;
}

/** Translation function for client components (all UI text still comes from the translation files). */
export function useT(): TFunction {
  return makeT(useContext(Ctx));
}

export const useLang = () => useContext(Ctx);
