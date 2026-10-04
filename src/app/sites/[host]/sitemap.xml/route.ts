import { loadDomainSite } from "@/lib/domain-site";
import { domainEntries, urlsetXml } from "@/lib/sitemaps";

export const dynamic = "force-dynamic";

/** Per-domain sitemap: only this site's own root-path pages. A lapsed domain drops out (404). */
export async function GET(_req: Request, rc: { params: Promise<{ host: string }> }) {
  const s = await loadDomainSite((await rc.params).host);
  if (!s || s.targetHost) return new Response("Not found", { status: 404 });
  return new Response(urlsetXml(await domainEntries(s.hostname, s.page.id)), { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
