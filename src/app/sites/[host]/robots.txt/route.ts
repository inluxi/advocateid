import { loadDomainSite } from "@/lib/domain-site";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, rc: { params: Promise<{ host: string }> }) {
  const s = await loadDomainSite((await rc.params).host);
  if (!s) return new Response("Not found", { status: 404 });
  // The hidden CNAME target is never indexed; a real domain is, with its own sitemap
  const body = s.targetHost
    ? "User-agent: *\nDisallow: /\n"
    : `User-agent: *\nAllow: /\nDisallow: /connect/\nDisallow: /*?*=*\n\nSitemap: https://${s.hostname}/sitemap.xml\n`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
