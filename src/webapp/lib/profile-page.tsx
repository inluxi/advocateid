import { cache } from "react";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getT } from "./ctx";
import { layoutFor, loadProfile, trackView, type ProfileCtx, type ProfileData } from "./profile";
import { profileMetadata, type MetaTab } from "./profile-meta";
import { withLang } from "./url";
import { resolveSlug, type PageRow } from "@/repo/pages";

type Loaded = { redirect: string } | { page: PageRow; ctx: ProfileCtx; data: ProfileData } | null;

/** Loaded once per request (shared by generateMetadata and the page). */
const load = cache(async (slug: string): Promise<Loaded> => {
  const { lang, t } = await getT();
  const r = await resolveSlug(slug);
  if (r.kind === "redirect") return { redirect: r.slug };
  if (r.kind !== "page" || r.page.status !== "active") return null; // deleted, recalled or suspended: 404 (App Router pages cannot send 410)
  const ctx: ProfileCtx = { mode: "main", lang, t, layout: layoutFor(r.page.plan, "main"), hostname: null };
  return { page: r.page, ctx, data: await loadProfile(r.page, ctx) };
});

/** Page, context (language, layout) and data for a main-site profile route. An old slug redirects permanently for 12 months. */
export async function mainProfile(slug: string, subPath = ""): Promise<{ page: PageRow; ctx: ProfileCtx; data: ProfileData }> {
  const loaded = await load(slug);
  if (!loaded) notFound();
  if ("redirect" in loaded) permanentRedirect(withLang(`/${loaded.redirect}${subPath}`, (await getT()).lang));
  return loaded;
}

export async function mainProfileMeta(slug: string, tab: MetaTab, opts: Parameters<typeof profileMetadata>[3] = {}): Promise<Metadata> {
  const loaded = await load(slug);
  if (!loaded || "redirect" in loaded) return { robots: { index: false } };
  return profileMetadata(loaded.data, loaded.ctx, tab, opts);
}

export { trackView };
