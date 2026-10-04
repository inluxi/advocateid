import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { domainMeta, loadDomainSite, requireDomainSite, trackView } from "@/lib/domain-site";
import { buildMetadata, articleJsonLd } from "@/lib/seo";
import { seoSlug } from "@/lib/text";
import { formatDate } from "@/lib/format";
import { imageUrl } from "@/lib/storage";
import { postContext } from "@/lib/post-context";
import { categoriesOfPosts, colleaguePageIds, getPost, similarPosts } from "@/repo/posts";
import { categoryNames, getCourt, listCategories } from "@/repo/reference";
import { ProfileShell } from "@/components/profile/ProfileShell";
import { PostBody } from "@/components/ui/PostBody";
import { JsonLd } from "@/components/ui/JsonLd";
import { PostCard } from "@/components/cards/PostCards";

type Props = { params: Promise<{ host: string; id: string; seo: string }> };

/** On a Premium domain the post lives at /p/{id}/{seo} and is the canonical copy; only the author's and colleagues' posts appear. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { host, id } = await params;
  const s = await loadDomainSite(host);
  const post = s && Number.isInteger(Number(id)) ? await getPost(Number(id)) : null;
  if (!s || !post || post.pageId !== s.page.id || post.status !== "published") return { robots: { index: false } };
  const base = await domainMeta(host, "posts", { title: post.title, description: post.body });
  return { ...base, ...buildMetadata({ title: `${post.title} | ${s.page.name}`, description: post.body, canonical: `https://${s.hostname}/p/${post.id}/${seoSlug(post.title)}`, noindex: s.targetHost, type: "article", image: imageUrl(post.coverImageKey, "l"), skipAlternates: true }) };
}

export default async function DomainPost({ params }: Props) {
  const { host, id, seo } = await params;
  const { page, ctx, data, hostname } = await requireDomainSite(host);
  const post = Number.isInteger(Number(id)) ? await getPost(Number(id)) : null;
  if (!post || post.pageId !== page.id || post.type !== "article" || post.status !== "published") notFound();
  if (seo !== seoSlug(post.title)) permanentRedirect(`/p/${post.id}/${seoSlug(post.title)}`);
  await trackView(page);
  const catIds = (await categoriesOfPosts([post.id])).get(post.id) ?? [];
  const [names, allCats, court, colleagues] = await Promise.all([categoryNames(ctx.lang), listCategories(), post.courtId ? getCourt(post.courtId) : null, colleaguePageIds(page.id)]);
  const similar = await similarPosts(post, catIds, 3, colleagues.filter((c) => c !== page.id));
  const pc = await postContext(similar, ctx.lang);
  const cats = catIds.map((c) => allCats.find((x) => x.id === c)).filter(Boolean) as typeof allCats;
  const { t, lang } = ctx;
  return (
    <ProfileShell data={data} ctx={ctx} active="posts">
      <JsonLd data={articleJsonLd({ headline: post.title, body: post.body, published: post.createdAt, modified: post.updatedAt, language: post.language, categories: cats.map((c) => names.get(c.id) ?? c.name), author: { name: page.name, url: `https://${hostname}/` }, court: court ? { name: court.name } : null, url: `https://${hostname}/p/${post.id}/${seoSlug(post.title)}` })} />
      <article className="card pad prose">
        <h1>{post.title}</h1>
        <p className="muted">{formatDate(post.createdAt, lang)}{court ? ` · ${court.name}` : ""}</p>
        <PostBody text={post.body} />
        <div className="chips">{cats.map((c) => <Link key={c.id} className="chip" href={`/posts?category=${c.code}`}>{names.get(c.id) ?? c.name}</Link>)}</div>
        <p className="inline-note">{t("post.disclaimer")}</p>
      </article>
      {similar.length ? (
        <section>
          <h2>{t("post.similar_colleagues")}</h2>
          <div className="grid g2">{similar.map((p) => <PostCard key={p.id} post={p} author={p.pageId ? pc.authors.get(p.pageId) : null} courtName={null} lang={lang} t={t} href={`/p/${p.id}/${seoSlug(p.title)}`} />)}</div>
        </section>
      ) : null}
    </ProfileShell>
  );
}
