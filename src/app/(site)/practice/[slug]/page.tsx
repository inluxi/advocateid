import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getT } from "@/lib/ctx";
import { localName } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { districtPracticePath, practiceIndexPath, practicePath, withLang } from "@/lib/url";
import { categoryNames, getCategoryBySlugOrCode, listDistricts } from "@/repo/reference";
import { countsByDistrictForCategory } from "@/repo/search";
import { postsForCategory } from "@/repo/posts";
import { postContext } from "@/lib/post-context";
import { PostCard } from "@/components/cards/PostCards";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, t } = await getT();
  const cat = await getCategoryBySlugOrCode((await params).slug);
  if (!cat) return { robots: { index: false } };
  const names = await categoryNames(lang);
  const name = names.get(cat.id) ?? cat.name;
  return buildMetadata({ title: t("practice.detail.title", { area: name }), description: t("practice.detail.description", { area: name }), canonical: practicePath(cat.slug, lang), hreflangPath: `/practice/${cat.slug}`, lang });
}

export default async function PracticePage({ params }: Props) {
  const { lang, t } = await getT();
  const cat = await getCategoryBySlugOrCode((await params).slug);
  if (!cat) notFound();
  const [names, districts, counts, posts] = await Promise.all([categoryNames(lang), listDistricts(), countsByDistrictForCategory(cat.code), postsForCategory(cat.id, 6)]);
  const name = names.get(cat.id) ?? cat.name;
  const ctx = await postContext(posts, lang);
  return (
    <div className="container section">
      <Breadcrumbs label={t("crumbs.label")} items={[{ name: t("crumbs.home"), href: withLang("/", lang) }, { name: t("nav.practice"), href: practiceIndexPath(lang) }, { name, href: practicePath(cat.slug, lang) }]} />
      <h1>{t("practice.detail.h1", { area: name })}</h1>
      <p className="muted">{t("practice.detail.intro", { area: name })}</p>
      <h2>{t("practice.detail.districts")}</h2>
      <div className="chips">
        {districts.map((d) => (
          <Link key={d.id} className="chip" href={districtPracticePath(d.code, cat.slug, lang)}>
            {localName(lang, d.name, d.localName)} ({counts.get(d.code) ?? 0})
          </Link>
        ))}
      </div>
      {posts.length ? (
        <section className="section">
          <h2>{t("practice.detail.posts", { area: name })}</h2>
          <div className="grid g2">{posts.map((p) => <PostCard key={p.id} post={p} author={p.pageId ? ctx.authors.get(p.pageId) : null} courtName={p.courtId ? ctx.courts.get(p.courtId) : null} lang={lang} t={t} />)}</div>
        </section>
      ) : null}
    </div>
  );
}
