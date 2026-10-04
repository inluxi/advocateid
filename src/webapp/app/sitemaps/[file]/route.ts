import { courtsEntries, officesEntries, postsEntries, profilesEntries, staticEntries, urlsetXml } from "@/lib/sitemaps";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, rc: { params: Promise<{ file: string }> }) {
  const m = (await rc.params).file.match(/^(static|courts|profiles|offices|posts)-(\d+)\.xml$/);
  if (!m) return new Response("Not found", { status: 404 });
  const n = Number(m[2]);
  const entries =
    m[1] === "static" ? await staticEntries()
    : m[1] === "courts" ? await courtsEntries(n)
    : m[1] === "profiles" ? await profilesEntries(n)
    : m[1] === "offices" ? await officesEntries(n)
    : await postsEntries(n);
  return new Response(urlsetXml(entries), { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
