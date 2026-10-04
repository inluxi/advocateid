import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/lib/ctx";
import { buildMetadata } from "@/lib/seo";
import { localName } from "@/lib/i18n";
import { OUTCOME_LABELS, LANGUAGE_OPTIONS, type Outcome } from "@/lib/outcomes";
import { profilePath, withLang } from "@/lib/url";
import { yearsSince } from "@/lib/text";
import { loadBundle, getPagesByIds, type PageBundle } from "@/repo/pages";
import { categoryNames, courtNames } from "@/repo/reference";
import { countPosts, postCountsByCategory } from "@/repo/posts";
import { Avatar } from "@/components/ui/Avatar";
import { RemoveCompare } from "@/components/ui/RemoveCompare";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ConnectButtons } from "@/components/profile/ConnectBar";

type Props = { searchParams: Promise<{ a?: string; b?: string; c?: string }> };

/** Comparison is temporary and informational: noindex, no canonical. No enrolment number, no verified mark, no ratings, no fees. */
export async function generateMetadata(): Promise<Metadata> {
  const { lang, t } = await getT();
  return { ...buildMetadata({ title: t("compare.page.title"), canonical: withLang("/compare", lang), noindex: true, lang }), alternates: undefined };
}

export default async function ComparePage({ searchParams }: Props) {
  const { lang, t } = await getT();
  const sp = await searchParams;
  const ids = [sp.a, sp.b, sp.c].map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 3);
  const pages = (await getPagesByIds(ids)).filter((p) => p.status === "active");
  const ordered = ids.map((id) => pages.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p);
  const [bundles, names, courts] = await Promise.all([Promise.all(ordered.map((p) => loadBundle(p))), categoryNames(lang), courtNames(lang)]);
  const postCats = await Promise.all(ordered.map((p) => postCountsByCategory(p.id)));
  const postTotals = await Promise.all(ordered.map((p) => countPosts(p.id)));
  const na = <span className="muted">{t("compare.na")}</span>;
  const rows: { label: string; cell: (b: PageBundle, i: number) => React.ReactNode }[] = [
    { label: t("compare.row.type"), cell: (b) => t(b.page.type === "firm" ? "card.firm" : "profile.advocate") },
    { label: t("compare.row.district"), cell: (b) => localName(lang, b.district.name, b.district.localName) },
    { label: t("compare.row.experience"), cell: (b) => { const y = yearsSince(b.page.type === "advocate" ? b.yearEnrolled : b.establishedYear); return y ? t("card.years", { n: y }) : na; } },
    { label: t("compare.row.courts"), cell: (b) => (b.courts.length ? <ul className="bullets">{b.courts.map((c) => <li key={c.id}>{courts.get(c.id) ?? c.name}</li>)}</ul> : na) },
    { label: t("compare.row.areas"), cell: (b) => (b.categories.length ? b.categories.map((c) => names.get(c.id) ?? c.name).join(", ") : na) },
    { label: t("compare.row.languages"), cell: (b) => (b.languages.length ? b.languages.map((l) => LANGUAGE_OPTIONS.find((o) => o.code === l.code)?.name ?? l.code).join(", ") : na) },
    { label: t("compare.row.highlights"), cell: (b) => (b.highlights.length ? <ul className="bullets">{b.highlights.map((h) => <li key={h.id}>{h.label}: {h.number}</li>)}</ul> : na) },
    { label: t("compare.row.outcomes"), cell: (b) => (b.cases.length ? <ul className="bullets">{b.cases.map((c) => <li key={c.id}>{c.year}, {OUTCOME_LABELS[c.outcome as Outcome] ?? c.outcome}</li>)}</ul> : na) },
    { label: t("compare.row.posts"), cell: (b, i) => (postTotals[i] ? <><div>{t("compare.posts_total", { n: postTotals[i] })}</div><ul className="bullets">{[...postCats[i].entries()].map(([cid, n]) => <li key={cid}>{names.get(cid) ?? cid}: {n}</li>)}</ul></> : na) },
    { label: t("compare.row.offices"), cell: (b) => (b.offices.length ? <ul className="bullets">{b.offices.map((o) => <li key={o.id}>{o.name}{o.isMain ? ` (${t("profile.main_office")})` : ""}</li>)}</ul> : na) },
  ];
  return (
    <div className="container section">
      <Breadcrumbs label={t("crumbs.label")} items={[{ name: t("crumbs.home"), href: withLang("/", lang) }, { name: t("compare.title"), href: withLang("/compare", lang) }]} />
      <h1>{t("compare.page.h1")}</h1>
      <p className="muted">{t("compare.page.intro")}</p>
      {bundles.length === 0 ? (
        <div className="card pad"><p>{t("compare.empty")}</p><Link className="btn" href={withLang("/search", lang)}>{t("nav.search")}</Link></div>
      ) : (
        <div className="cmp-wrap">
          <table className="cmp-table">
            <thead>
              <tr>
                <th scope="col"><span className="sr-only">{t("compare.row.type")}</span></th>
                {bundles.map((b) => (
                  <th scope="col" key={b.page.id} className="cmp-head">
                    <Avatar name={b.page.name} photoKey={b.page.photoKey} size="s" className="avatar" />
                    <div><Link href={profilePath(b.page.slug, lang)}><strong>{b.page.name}</strong></Link></div>
                    <RemoveCompare pageId={b.page.id} remaining={ids.filter((i) => i !== b.page.id)} label={t("compare.remove")} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <th scope="row">{r.label}</th>
                  {bundles.map((b, i) => <td key={b.page.id}>{r.cell(b, i)}</td>)}
                </tr>
              ))}
              <tr>
                <th scope="row">{t("connect")}</th>
                {bundles.map((b) => <td key={b.page.id}>{b.page.contactMobile ? <div className="row"><ConnectButtons pageId={b.page.id} t={t} /></div> : na}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
