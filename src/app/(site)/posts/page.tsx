import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getT } from "@/lib/ctx";
import { buildMetadata } from "@/lib/seo";
import { postPath, practicePath, profilePath, searchUrl, withLang } from "@/lib/url";
import { postContext } from "@/lib/post-context";
import { categoryNames, getCategoryBySlugOrCode, getLocality } from "@/repo/reference";
import { authorCategoryPosts } from "@/repo/posts";
import { getPage } from "@/repo/pages";
import { PostCard } from "@/components/cards/PostCards";
import { PostBody } from "@/components/ui/PostBody";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

type Props = { searchParams: Promise<{ author?: string; category?: string }> };

async function load(sp: { author?: string; category?: string }) {
  const authorId = Number(sp.author);
  if (!Number.isInteger(authorId) || !sp.category) return null;
  const [author, cat] = await Promise.all([getPage(authorId), getCategoryBySlugOrCode(sp.category)]);
  if (!author || author.status !== "active" || !cat) return null;
  return { author, cat };
}

/** Professional practice-area click: always noindex; canonical is the practice-area page. */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { lang, t } = await getT();
  const data = await load(await searchParams);
  return buildMetadata({ title: t("posts.title"), canonical: data ? practicePath(data.cat.slug, lang) : withLang("/practice", lang), noindex: true, lang });
}

export default async function AuthorPostsPage({ searchParams }: Props) {
  const { lang, t } = await getT();
  const data = await load(await searchParams);
  if (!data) notFound();
  const { author, cat } = data;
  const { latest, authorPosts, others } = await authorCategoryPosts(author.id, cat.id);
  const district = await getLocality(author.districtId);
  const fallback = searchUrl({ d: district?.code, p: cat.code, first: String(author.id) }, lang);
  // No post in that category: fall back to search with the source page first
  if (!latest) redirect(fallback);
  const names = await categoryNames(lang);
  const catName = names.get(cat.id) ?? cat.name;
  const ctx = await postContext([latest, ...authorPosts, ...others], lang);
  return (
    <div className="container section">
      <Breadcrumbs label={t("crumbs.label")} items={[{ name: t("crumbs.home"), href: withLang("/", lang) }, { name: author.name, href: profilePath(author.slug, lang) }, { name: catName, href: practicePath(cat.slug, lang) }]} />
      <h1>{t("posts.h1", { area: catName, name: author.name })}</h1>
      <article className="card pad prose">
        <h2><Link href={postPath(latest, lang)}>{latest.title}</Link></h2>
        <PostBody text={latest.body.slice(0, 600)} />
        <p><Link href={postPath(latest, lang)}>{t("posts.read")}</Link></p>
      </article>
      {authorPosts.length ? (
        <section className="section tight">
          <h2>{t("posts.more_by", { name: author.name })}</h2>
          <div className="grid g2">{authorPosts.map((p) => <PostCard key={p.id} post={p} author={ctx.authors.get(author.id)} courtName={null} lang={lang} t={t} />)}</div>
        </section>
      ) : null}
      {others.length ? (
        <section className="section tight">
          <h2>{t("posts.similar")}</h2>
          <div className="grid g2">{others.map((p) => <PostCard key={p.id} post={p} author={p.pageId ? ctx.authors.get(p.pageId) : null} courtName={null} lang={lang} t={t} />)}</div>
        </section>
      ) : null}
      <p><Link href={fallback}>{t("posts.see_advocates", { area: catName })}</Link></p>
    </div>
  );
}
