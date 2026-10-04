import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { getT } from "@/lib/ctx";
import { formatDate } from "@/lib/format";
import { articleJsonLd, buildMetadata } from "@/lib/seo";
import { absolute, courtPath, postPath, practicePath, profilePath, withLang } from "@/lib/url";
import { seoSlug } from "@/lib/text";
import { domainCanonical } from "@/lib/canonical";
import { imageUrl } from "@/lib/storage";
import { postContext } from "@/lib/post-context";
import { categoryNames, getCourt, listCategories } from "@/repo/reference";
import { categoriesOfPosts, getPost, listPostsByPage, similarPosts } from "@/repo/posts";
import { getPage } from "@/repo/pages";
import { getDomainForPage } from "@/repo/domains";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/ui/JsonLd";
import { PostBody } from "@/components/ui/PostBody";
import { PostCard } from "@/components/cards/PostCards";
import { Avatar } from "@/components/ui/Avatar";

type Props = { params: Promise<{ id: string; seo: string }> };

async function load(id: string) {
  const post = Number.isInteger(Number(id)) ? await getPost(Number(id)) : null;
  if (!post || post.type !== "article" || post.status !== "published" || !post.pageId) return null;
  const author = await getPage(post.pageId);
  if (!author || author.status !== "active") return null;
  const dom = await getDomainForPage(author.id);
  return { post, author, domain: dom?.status === "active" ? dom.hostname : null };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await getT();
  const data = await load((await params).id);
  if (!data) return { robots: { index: false } };
  const { post, author, domain } = data;
  // Premium with an active domain: the copy on the domain (/p/{id}/{seo}) is canonical; this global copy is excluded from search engines
  const external = domainCanonical(author.plan, domain, `/p/${post.id}/${seoSlug(post.title)}`);
  return buildMetadata({
    title: post.title, description: post.body, canonical: external ?? postPath(post, lang), noindex: !!external, type: "article",
    image: imageUrl(post.coverImageKey, "l"), hreflangPath: `/post/${post.id}/${seoSlug(post.title)}`, lang,
  });
}

export default async function PostPage({ params }: Props) {
  const { lang, t } = await getT();
  const { id, seo } = await params;
  const data = await load(id);
  if (!data) notFound();
  const { post, author } = data;
  if (seo !== seoSlug(post.title)) permanentRedirect(postPath(post, lang));
  const catMap = await categoriesOfPosts([post.id]);
  const catIds = catMap.get(post.id) ?? [];
  const [names, allCats, court, authorPosts, similar] = await Promise.all([
    categoryNames(lang), listCategories(), post.courtId ? getCourt(post.courtId) : null,
    listPostsByPage(author.id, { type: "article", limit: 4 }), similarPosts(post, catIds, 3),
  ]);
  const others = authorPosts.filter((p) => p.id !== post.id).slice(0, 3);
  const ctx = await postContext(similar, lang);
  const cats = catIds.map((cid) => allCats.find((c) => c.id === cid)).filter(Boolean) as typeof allCats;
  return (
    <div className="container section">
      <Breadcrumbs label={t("crumbs.label")} items={[{ name: t("crumbs.home"), href: withLang("/", lang) }, { name: author.name, href: profilePath(author.slug, lang) }, { name: post.title, href: postPath(post, lang) }]} />
      <JsonLd data={articleJsonLd({
        headline: post.title, body: post.body, image: imageUrl(post.coverImageKey, "l") ? absolute(imageUrl(post.coverImageKey, "l")!) : null,
        published: post.createdAt, modified: post.updatedAt, language: post.language, categories: cats.map((c) => names.get(c.id) ?? c.name),
        author: { name: author.name, url: absolute(profilePath(author.slug)) }, court: court ? { name: court.name } : null, url: absolute(postPath(post)),
      })} />
      <div className="layout-2">
        <article className="prose">
          <h1>{post.title}</h1>
          <p className="muted">
            {formatDate(post.createdAt, lang)}
            {court ? <> · <Link href={courtPath(court, lang)}>{court.name}</Link></> : null}
          </p>
          {imageUrl(post.coverImageKey, "l") ? <img className="post-cover" style={{ height: "auto", borderRadius: 10 }} src={imageUrl(post.coverImageKey, "l")!} alt="" /> : null}
          <PostBody text={post.body} />
          <div className="chips">{cats.map((c) => <Link key={c.id} className="chip" href={practicePath(c.slug, lang)}>{names.get(c.id) ?? c.name}</Link>)}</div>
          {post.sourceUrl ? <p><a href={post.sourceUrl} rel="nofollow noopener noreferrer" target="_blank">{t("update.source")}</a></p> : null}
          <p className="inline-note">{t("post.disclaimer")}</p>
          <p><Link href={`/report?type=post&id=${post.id}`}>{t("report.link")}</Link></p>
        </article>
        <aside className="aside">
          <div className="card aside-card">
            <h2>{t("post.author")}</h2>
            <div className="row">
              <Avatar name={author.name} photoKey={author.photoKey} size="s" />
              <div>
                <Link href={profilePath(author.slug, lang)}><strong>{author.name}</strong></Link>
                <div className="muted small">{t(author.type === "firm" ? "card.firm" : "post.advocate")}</div>
              </div>
            </div>
            {others.length ? <><h3 style={{ marginTop: 16 }}>{t("post.more_by", { name: author.name })}</h3><ul className="bullets">{others.map((p) => <li key={p.id}><Link href={postPath(p, lang)}>{p.title}</Link></li>)}</ul></> : null}
          </div>
        </aside>
      </div>
      {similar.length ? (
        <section className="section">
          <h2>{t("post.similar")}</h2>
          <div className="grid g3">{similar.map((p) => <PostCard key={p.id} post={p} author={p.pageId ? ctx.authors.get(p.pageId) : null} courtName={null} lang={lang} t={t} />)}</div>
        </section>
      ) : null}
    </div>
  );
}
