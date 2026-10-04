import { absolute } from "@/lib/url";
import { SITEMAP_PAGE_SIZE, counts, indexXml } from "@/lib/sitemaps";

export const dynamic = "force-dynamic";

/** Index of all sitemaps (static, courts, profiles, offices, posts). Cached at the edge for an hour. */
export async function GET() {
  const c = await counts();
  const files = [{ loc: absolute("/sitemaps/static-1.xml") }];
  const add = (kind: string, n: number) => {
    for (let i = 1; i <= Math.max(1, Math.ceil(n / SITEMAP_PAGE_SIZE)); i++) files.push({ loc: absolute(`/sitemaps/${kind}-${i}.xml`) });
  };
  add("courts", c.courts);
  add("profiles", c.profiles);
  add("offices", c.offices);
  add("posts", c.posts);
  return new Response(indexXml(files), { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
