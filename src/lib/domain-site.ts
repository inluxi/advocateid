import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getT } from "./ctx";
import { classifyHost } from "./host";
import { entitlementsFor } from "./entitlements";
import { layoutFor, loadProfile, trackView, type ProfileCtx, type ProfileData } from "./profile";
import { profileMetadata, type MetaTab } from "./profile-meta";
import { resolveDomain } from "@/repo/domains";
import { getPageBySlug, type PageRow } from "@/repo/pages";

export interface DomainSite {
  page: PageRow;
  ctx: ProfileCtx;
  data: ProfileData;
  hostname: string;
  /** {slug}.p.advocateid.in: reachable but hidden from search engines. */
  targetHost: boolean;
}

/**
 * Resolve the internal /sites/{host} tree to a Premium page. A custom domain must be active (verified);
 * a lapsed or unknown domain returns 404 and advocateid.in/{slug} keeps working.
 */
export const loadDomainSite = cache(async (hostParam: string): Promise<DomainSite | null> => {
  const host = decodeURIComponent(hostParam).toLowerCase();
  const kind = classifyHost(host);
  let page: PageRow | null = null;
  let targetHost = false;
  if (kind.kind === "custom") {
    page = (await resolveDomain(kind.hostname))?.page ?? null;
  } else if (kind.kind === "target") {
    page = await getPageBySlug(kind.slug);
    targetHost = true;
  }
  if (!page || page.status !== "active" || !entitlementsFor(page.plan).customDomain) return null;
  const { lang, t } = await getT();
  const ctx: ProfileCtx = { mode: "domain", lang, t, layout: layoutFor(page.plan, "domain"), hostname: host };
  return { page, ctx, data: await loadProfile(page, ctx), hostname: host, targetHost };
});

export async function requireDomainSite(hostParam: string): Promise<DomainSite> {
  const s = await loadDomainSite(hostParam);
  if (!s) notFound();
  return s;
}

export async function domainMeta(hostParam: string, tab: MetaTab, opts: Parameters<typeof profileMetadata>[3] = {}): Promise<Metadata> {
  const s = await loadDomainSite(hostParam);
  if (!s) return { robots: { index: false } };
  return profileMetadata(s.data, s.ctx, tab, { ...opts, targetHost: s.targetHost });
}

export { trackView };
