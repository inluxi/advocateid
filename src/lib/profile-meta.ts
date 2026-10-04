import type { Metadata } from "next";
import type { ProfileCtx, ProfileData } from "./profile";
import { domainCanonical } from "./canonical";
import { buildMetadata } from "./seo";
import { imageUrl } from "./storage";
import { localName } from "./i18n";
import { withLang } from "./url";

export type MetaTab = "overview" | "posts" | "offices" | "lawyers" | "office";

/**
 * Canonical and indexing rules for a profile page.
 * - Basic / Professional / Premium without an active domain: the page on advocateid.in is canonical and indexed.
 * - Premium with an active domain: the domain is canonical; advocateid.in/{slug} is noindex with a canonical to the domain.
 * - On a custom domain: canonical = the domain itself. The {slug}.p.advocateid.in target is always noindex.
 */
export function profileMetadata(data: ProfileData, ctx: ProfileCtx, tab: MetaTab, opts: { path?: string; title?: string; description?: string | null; noindex?: boolean; targetHost?: boolean } = {}): Metadata {
  const { page, district, seo } = data.bundle;
  const { t, lang } = ctx;
  const subPath = tab === "overview" ? "" : tab === "office" ? (opts.path ?? "") : `/${tab}`;
  const domainPath = tab === "office" ? (opts.path ?? "") : subPath || "/";
  const mainPath = `/${page.slug}${subPath}`;
  const dName = localName(lang, district.name, district.localName);
  const isFirm = page.type === "firm";
  const baseTitle = seo?.title || t(isFirm ? "profile.title_firm" : "profile.title_advocate", { name: page.name, district: dName });
  const title = opts.title ? `${opts.title} | ${page.name}` : baseTitle;
  const description = opts.description ?? seo?.description ?? page.bio ?? page.about;
  const image = imageUrl(isFirm ? (page.bannerKey ?? page.photoKey) : page.photoKey, "l");

  if (ctx.mode === "domain" && ctx.hostname && !opts.targetHost) {
    return buildMetadata({ title, description, canonical: `https://${ctx.hostname}${domainPath}`, image, type: "profile", noindex: opts.noindex, skipAlternates: true });
  }
  if (ctx.mode === "domain") {
    // {slug}.p.advocateid.in: hidden CNAME target
    const external = domainCanonical(page.plan, data.bundle.activeDomain, domainPath);
    return buildMetadata({ title, description, canonical: external ?? mainPath, image, type: "profile", noindex: true, skipAlternates: true });
  }
  const external = domainCanonical(page.plan, data.bundle.activeDomain, domainPath);
  return buildMetadata({
    title, description, canonical: external ?? withLang(mainPath, lang), image, type: "profile",
    noindex: !!external || opts.noindex,
    hreflangPath: mainPath, lang,
  });
}
