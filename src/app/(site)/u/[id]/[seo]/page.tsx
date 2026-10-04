import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { getT } from "@/lib/ctx";
import { formatDate } from "@/lib/format";
import { articleJsonLd, buildMetadata } from "@/lib/seo";
import { absolute, courtPath, profilePath, updatePath, withLang } from "@/lib/url";
import { seoSlug } from "@/lib/text";
import { getCourt } from "@/repo/reference";
import { getPost } from "@/repo/posts";
import { getPage } from "@/repo/pages";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/ui/JsonLd";
import { PostBody } from "@/components/ui/PostBody";

type Props = { params: Promise<{ id: string; seo: string }> };

async function load(id: string) {
  const post = Number.isInteger(Number(id)) ? await getPost(Number(id)) : null;
  if (!post || post.type !== "court_update" || post.status !== "published") return null;
  const [court, author] = await Promise.all([post.courtId ? getCourt(post.courtId) : null, post.pageId ? getPage(post.pageId) : null]);
  return { post, court, author: author && author.status === "active" ? author : null };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await getT();
  const data = await load((await params).id);
  if (!data) return { robots: { index: false } };
  return buildMetadata({ title: data.post.title, description: data.post.body, canonical: updatePath(data.post, lang), type: "article", hreflangPath: `/u/${data.post.id}/${seoSlug(data.post.title)}`, lang });
}

export default async function UpdatePage({ params }: Props) {
  const { lang, t } = await getT();
  const { id, seo } = await params;
  const data = await load(id);
  if (!data) notFound();
  const { post, court, author } = data;
  if (seo !== seoSlug(post.title)) permanentRedirect(updatePath(post, lang));
  const crumbs = [
    { name: t("crumbs.home"), href: withLang("/", lang) },
    ...(court ? [{ name: court.name, href: courtPath(court, lang) }] : []),
    { name: post.title, href: updatePath(post, lang) },
  ];
  return (
    <div className="container section">
      <Breadcrumbs items={crumbs} label={t("crumbs.label")} />
      <JsonLd data={articleJsonLd({
        headline: post.title, body: post.body, published: post.createdAt, modified: post.updatedAt, language: post.language, courtUpdate: true,
        author: author ? { name: author.name, url: absolute(profilePath(author.slug)) } : null,
        court: court ? { name: court.name, url: absolute(courtPath(court)) } : null,
        url: absolute(updatePath(post)),
      })} />
      <article className="prose">
        <h1>{post.title}</h1>
        <p className="muted">
          {formatDate(post.createdAt, lang)}
          {court ? <> · <Link href={courtPath(court, lang)}>{court.name}</Link></> : null}
          {" · "}
          {author ? t("update.contributed_by", { name: author.name }) : t("update.official")}
        </p>
        <PostBody text={post.body} />
        {post.sourceUrl ? <p><a href={post.sourceUrl} rel="nofollow noopener noreferrer" target="_blank">{t("update.source")}</a></p> : null}
        <p className="inline-note">{t("update.disclaimer")}</p>
        <p><Link href={`/report?type=update&id=${post.id}`}>{t("report.link")}</Link></p>
      </article>
    </div>
  );
}
