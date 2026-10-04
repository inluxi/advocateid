import { after } from "next/server";
import { entitlementsFor } from "./entitlements";
import type { Lang, TFunction } from "./i18n";
import { absolute, withLang } from "./url";
import { getVisitor, isOwnerOf } from "./request-context";
import { loadBundle, type PageBundle, type PageRow } from "@/repo/pages";
import { listFirmsOf, listLawyers, type FirmView, type LawyerView } from "@/repo/memberships";
import { listPostsByPage, type Post } from "@/repo/posts";
import { similarAndNearby, type Card } from "@/repo/search";
import { categoryNames, courtNames } from "@/repo/reference";
import { recordEvent } from "@/repo/analytics";

export type Layout = "basic" | "pro" | "premium";

export interface ProfileCtx {
  mode: "main" | "domain";
  lang: Lang;
  t: TFunction;
  /** Layout derived from the plan; Premium looks like its own website only on its own domain. */
  layout: Layout;
  hostname: string | null;
}

export const layoutFor = (plan: string, mode: "main" | "domain"): Layout =>
  mode === "domain" && entitlementsFor(plan).premiumLayout ? "premium" : plan === "basic" ? "basic" : "pro";

/** Link builder: root-path links on a custom domain, /{slug}/... on advocateid.in. */
export function profilePaths(ctx: ProfileCtx, slug: string) {
  const home = ctx.mode === "domain" ? "" : `/${slug}`;
  return {
    home: ctx.mode === "domain" ? "/" : withLang(`/${slug}`, ctx.lang),
    posts: `${home}/posts`,
    offices: `${home}/offices`,
    lawyers: `${home}/lawyers`,
    contact: ctx.mode === "domain" ? "/contact" : `/${slug}`,
    office: (o: { id: number; name: string }, seo: string) => (ctx.mode === "domain" ? `/o/${o.id}/${seo}` : `/${slug}/o/${o.id}/${seo}`),
    post: (p: { id: number }, seo: string) => (ctx.mode === "domain" ? `/p/${p.id}/${seo}` : `/post/${p.id}/${seo}`),
    lawyer: (name: string) => `/lawyers/${name}`,
  };
}

export interface ProfileData {
  bundle: PageBundle;
  lawyers: { items: LawyerView[]; hidden: number } | null;
  firms: FirmView[];
  posts: Post[];
  catNames: Map<number, string>;
  courtNameMap: Map<number, string>;
  competitors: { nearby: Card[]; similar: Card[] } | null;
  isOwner: boolean;
}

export async function loadProfile(page: PageRow, ctx: ProfileCtx): Promise<ProfileData> {
  const bundle = await loadBundle(page);
  const ent = entitlementsFor(page.plan);
  const [lawyers, firms, posts, catNames, courtNameMap, isOwner] = await Promise.all([
    page.type === "firm" ? listLawyers(page, { forDomain: ctx.mode === "domain" }) : Promise.resolve(null),
    page.type === "advocate" ? listFirmsOf(page.id) : Promise.resolve([]),
    listPostsByPage(page.id, { type: "article", limit: 3 }),
    categoryNames(ctx.lang),
    courtNames(ctx.lang),
    isOwnerOf(page.accountId),
  ]);
  const showFirms = ent.memberOfToggle ? (bundle.custom?.showMemberOf ?? true) : true;
  const competitors = ent.showCompetitorBlocks && ctx.mode === "main" ? await similarAndNearby(page, ctx.lang) : null;
  return { bundle, lawyers, firms: showFirms ? firms : [], posts, catNames, courtNameMap, competitors, isOwner };
}

/** A view is recorded for every load (with owner and bot flags) per host, after the response. */
export async function trackView(page: PageRow): Promise<void> {
  const v = await getVisitor();
  const owner = await isOwnerOf(page.accountId);
  after(() =>
    recordEvent({ pageId: page.id, host: v.host || "advocateid.in", visitorId: v.visitorId, eventType: "view", context: "page", isOwner: owner, isBot: v.isBot }),
  );
}

export const pageUrl = (slug: string, domain: string | null) => (domain ? `https://${domain}/` : absolute(`/${slug}`));
