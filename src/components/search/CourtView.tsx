import Link from "next/link";
import { getT } from "@/lib/ctx";
import { localName, type Lang } from "@/lib/i18n";
import { absolute, courtPath, courtPracticePath, courtUpdatesPath, districtPath, withLang } from "@/lib/url";
import { courtJsonLd } from "@/lib/seo";
import type { SearchParams } from "@/lib/url";
import { categoryNames, getCourtDetails, getLocality, listCategories, type Court, type Category } from "@/repo/reference";
import { listCourtPosts, listCourtUpdates } from "@/repo/posts";
import { newlyJoinedForCourt, runSearch } from "@/repo/search";
import { getSavedIds } from "@/lib/request-context";
import { trackImpressions } from "@/lib/impressions";
import { postContext } from "@/lib/post-context";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/ui/JsonLd";
import { PostCard } from "@/components/cards/PostCards";
import { AdvocateCard } from "@/components/cards/AdvocateCard";
import { AddCourtButton } from "@/components/manage/AddCourtButton";
import { CourtAdvocates } from "./CourtAdvocates";
import { Icon } from "@/components/Icon";

export type CourtTab = "overview" | "advocates" | "new" | "updates";

/** The main sales page: advocates are invited to create a page and be listed here. */
export async function CourtView({ court, tab, params, lang, practice }: { court: Court; tab: CourtTab; params: SearchParams; lang: Lang; practice?: Category | null }) {
  const { t } = await getT();
  const [district, details, names] = await Promise.all([court.districtId ? getLocality(court.districtId) : null, getCourtDetails(court.id), categoryNames(lang)]);
  const base = practice ? courtPracticePath(court, practice.slug, lang) : courtPath(court, lang);
  const cName = localName(lang, court.name, court.localName);
  const phone = details.find((d) => /phone/i.test(d.keyName))?.value;
  const mapUrl = court.lat != null && court.lng != null ? `https://www.openstreetmap.org/?mlat=${court.lat}&mlon=${court.lng}#map=17/${court.lat}/${court.lng}` : null;
  const crumbs = [
    { name: t("crumbs.home"), href: withLang("/", lang) },
    ...(district ? [{ name: localName(lang, district.name, district.localName), href: districtPath(district.code, lang) }] : []),
    { name: cName, href: courtPath(court, lang) },
    ...(practice ? [{ name: names.get(practice.id) ?? practice.name, href: base }] : []),
  ];
  const tabs: { id: CourtTab; label: string }[] = [
    { id: "overview", label: t("court.tab.overview") },
    { id: "advocates", label: t("court.tab.advocates") },
    { id: "new", label: t("court.tab.new") },
    { id: "updates", label: t("court.tab.updates") },
  ];
  const addLabels = { add: t("court.add"), choose: t("court.add_choose"), done: t("court.add_done"), login: t("court.add_login"), failed: t("court.add_failed"), none: t("court.add_none") };
  const jsonLd = courtJsonLd({
    name: court.name, url: absolute(courtPath(court, "en")), address: court.address, locality: district?.name ?? null, district: district?.name ?? null,
    pincode: court.pincode, lat: court.lat, lng: court.lng, phone, website: court.website,
  });

  return (
    <>
      <JsonLd data={jsonLd} />
      <section className="page-hero">
        <div className="container">
          <Breadcrumbs items={crumbs} dark label={t("crumbs.label")} />
          <h1>{practice ? t("court.h1_practice", { area: names.get(practice.id) ?? practice.name, court: cName }) : cName}</h1>
          <p>
            {[court.kind, district ? localName(lang, district.name, district.localName) : null, court.address].filter(Boolean).join(" · ")}
            {lang === "en" && court.localName ? <><br /><span lang="ml">{court.localName}</span></> : null}
          </p>
        </div>
      </section>
      <div className="container section tight">
        <div className="signup slim">
          <p>{t("court.signup")}</p>
          <Link className="btn btn-sm" href="/login">{t("court.signup_cta")}</Link>
        </div>
        <nav className="tabs" aria-label={t("court.tabs")}>
          {tabs.map((x) => (
            <Link key={x.id} className="tab" aria-selected={tab === x.id} aria-current={tab === x.id ? "page" : undefined} href={x.id === "overview" ? base : `${base}?tab=${x.id}`}>{x.label}</Link>
          ))}
        </nav>
        {tab === "overview" ? <Overview court={court} lang={lang} details={details} mapUrl={mapUrl} district={district} /> : null}
        {tab === "advocates" ? (
          <CourtAdvocates court={court} params={params} basePath={base} lang={lang} extraHidden={{ tab: "advocates" }} practiceCode={practice?.code} />
        ) : null}
        {tab === "new" ? <NewlyJoined court={court} lang={lang} /> : null}
        {tab === "updates" ? <Updates court={court} lang={lang} /> : null}
        <section className="section">
          <div className="signup">
            <div>
              <h2>{t("court.cta.title")}</h2>
              <p>{t("court.cta.body")}</p>
            </div>
            <AddCourtButton courtId={court.id} labels={addLabels} />
          </div>
        </section>
        <section className="section tight">
          <h2>{t("court.by_practice")}</h2>
          <div className="chips">
            {(await listCategories()).map((c) => <Link key={c.id} className="chip" href={courtPracticePath(court, c.slug, lang)}>{names.get(c.id) ?? c.name}</Link>)}
          </div>
        </section>
        {phone ? <p className="inline-note">{t("court.phone_note")}</p> : null}
      </div>
    </>
  );
}

async function Overview({ court, lang, details, mapUrl, district }: { court: Court; lang: Lang; details: Awaited<ReturnType<typeof getCourtDetails>>; mapUrl: string | null; district: Awaited<ReturnType<typeof getLocality>> }) {
  const { t } = await getT();
  const [updates, preview, { compare, bookmarks }] = await Promise.all([listCourtUpdates(court.id, 3), runSearch({ c: court.code }, { lang, pageSize: 5 }), getSavedIds()]);
  const ctx = await postContext(updates, lang);
  await trackImpressions(preview.cards, "court");
  const rows = [
    court.address ? { k: t("court.address"), v: court.address } : null,
    court.pincode ? { k: t("court.pincode"), v: court.pincode } : null,
    district ? { k: t("court.district"), v: localName(lang, district.name, district.localName) } : null,
    ...details.map((d) => ({ k: d.keyName, v: d.value })),
  ].filter((x): x is { k: string; v: string } => !!x);
  return (
    <div className="layout-2">
      <div className="stack">
        <section className="card pad">
          <h2>{t("court.latest_updates")}</h2>
          {updates.length ? (
            <div className="stack">
              {updates.map((u) => <PostCard key={u.id} post={u} author={u.pageId ? ctx.authors.get(u.pageId) : null} courtName={null} lang={lang} t={t} />)}
              <Link href={courtUpdatesPath(court, lang)}>{t("court.all_updates")}</Link>
            </div>
          ) : <p className="muted">{t("court.no_updates")}</p>}
        </section>
        <section>
          <div className="section-head"><h2>{t("court.advocates_here")}</h2><Link href={`${courtPath(court, lang)}?tab=advocates`}>{t("court.see_all")}</Link></div>
          {preview.cards.length ? <div className="stack">{preview.cards.map((c) => <AdvocateCard key={c.key} card={c} lang={lang} t={t} compare={compare} bookmarks={bookmarks} />)}</div> : <p className="muted">{t("court.no_advocates")}</p>}
        </section>
      </div>
      <aside className="aside">
        <section className="card aside-card">
          <h2>{t("court.details")}</h2>
          <table className="kvtable"><tbody>{rows.map((r) => <tr key={r.k + r.v}><td>{r.k}</td><td>{r.v}</td></tr>)}</tbody></table>
          {mapUrl ? <p><a href={mapUrl} rel="noopener noreferrer nofollow" target="_blank"><Icon name="pin" size="sm" /> {t("court.map")}</a></p> : null}
        </section>
      </aside>
    </div>
  );
}

async function NewlyJoined({ court, lang }: { court: Court; lang: Lang }) {
  const { t } = await getT();
  const [cards, { compare, bookmarks }] = await Promise.all([newlyJoinedForCourt(court.code, 10, lang), getSavedIds()]);
  await trackImpressions(cards, "court");
  return cards.length ? <div className="stack">{cards.map((c) => <AdvocateCard key={c.key} card={c} lang={lang} t={t} compare={compare} bookmarks={bookmarks} />)}</div> : <p className="muted">{t("court.no_advocates")}</p>;
}

async function Updates({ court, lang }: { court: Court; lang: Lang }) {
  const { t } = await getT();
  const [updates, posts] = await Promise.all([listCourtUpdates(court.id, 20), listCourtPosts(court.id, 10)]);
  const ctx = await postContext([...updates, ...posts], lang);
  return (
    <div className="stack">
      <h2>{t("court.tab.updates")}</h2>
      {updates.length === 0 && posts.length === 0 ? <p className="muted">{t("court.no_updates")}</p> : null}
      <div className="grid g2">
        {[...updates, ...posts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).map((p) => (
          <PostCard key={`${p.type}-${p.id}`} post={p} author={p.pageId ? ctx.authors.get(p.pageId) : null} courtName={null} lang={lang} t={t} />
        ))}
      </div>
    </div>
  );
}
