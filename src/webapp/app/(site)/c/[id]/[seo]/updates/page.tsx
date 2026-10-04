import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { getT } from "@/lib/ctx";
import { localName } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { courtPath, courtUpdatesPath, withLang } from "@/lib/url";
import { seoSlug } from "@/lib/text";
import { getCourt } from "@/repo/reference";
import { listCourtUpdates } from "@/repo/posts";
import { postContext } from "@/lib/post-context";
import { PostCard } from "@/components/cards/PostCards";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Pager } from "@/components/ui/Pager";
import { ContributeUpdate } from "@/components/manage/ContributeUpdate";

type Props = { params: Promise<{ id: string; seo: string }>; searchParams: Promise<{ page?: string }> };
const SIZE = 20;

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { lang, t } = await getT();
  const { id } = await params;
  const court = Number.isInteger(Number(id)) ? await getCourt(Number(id)) : null;
  if (!court) return { robots: { index: false } };
  const page = Number((await searchParams).page ?? 1);
  return buildMetadata({
    title: t("updates.title", { court: localName(lang, court.name, court.localName) }),
    description: t("updates.description", { court: localName(lang, court.name, court.localName) }),
    canonical: courtUpdatesPath(court, lang),
    noindex: page > 1,
    hreflangPath: `/c/${court.id}/${seoSlug(court.name)}/updates`,
    lang,
  });
}

export default async function CourtUpdatesPage({ params, searchParams }: Props) {
  const { lang, t } = await getT();
  const { id, seo } = await params;
  const court = Number.isInteger(Number(id)) ? await getCourt(Number(id)) : null;
  if (!court) notFound();
  if (seo !== seoSlug(court.name)) permanentRedirect(courtUpdatesPath(court, lang));
  const page = Math.max(1, Number((await searchParams).page ?? 1) || 1);
  const rows = await listCourtUpdates(court.id, SIZE + 1, (page - 1) * SIZE);
  const list = rows.slice(0, SIZE);
  const ctx = await postContext(list, lang);
  const name = localName(lang, court.name, court.localName);
  return (
    <div className="container section">
      <Breadcrumbs label={t("crumbs.label")} items={[{ name: t("crumbs.home"), href: withLang("/", lang) }, { name, href: courtPath(court, lang) }, { name: t("updates.crumb"), href: courtUpdatesPath(court, lang) }]} />
      <h1>{t("updates.h1", { court: name })}</h1>
      {list.length ? (
        <div className="grid g2">{list.map((u) => <PostCard key={u.id} post={u} author={u.pageId ? ctx.authors.get(u.pageId) : null} courtName={null} lang={lang} t={t} />)}</div>
      ) : <p className="muted">{t("court.no_updates")}</p>}
      <Pager page={page} prevHref={page > 1 ? `${courtUpdatesPath(court, lang)}?page=${page - 1}` : null} nextHref={rows.length > SIZE ? `${courtUpdatesPath(court, lang)}?page=${page + 1}` : null} labels={{ next: t("pager.next"), prev: t("pager.prev"), page: t("pager.label") }} />
      <section className="section">
        <h2>{t("updates.contribute")}</h2>
        <p className="muted">{t("updates.contribute_body")}</p>
        <ContributeUpdate courtId={court.id} />
        <p><Link href="/contact?kind=court_request">{t("updates.missing_court")}</Link></p>
      </section>
    </div>
  );
}
