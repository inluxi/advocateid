import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { PostCard } from "@/components/cards/PostCards";
import { Pager } from "@/components/ui/Pager";
import { Avatar } from "@/components/ui/Avatar";
import { JsonLd } from "@/components/ui/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { localName } from "@/lib/i18n";
import { profilePaths, type ProfileCtx, type ProfileData } from "@/lib/profile";
import { seoSlug } from "@/lib/text";
import { absolute, courtPath, withLang } from "@/lib/url";
import { officeJsonLd } from "@/lib/seo";
import { postContext } from "@/lib/post-context";
import { imageUrl } from "@/lib/storage";
import { colleaguePageIds, listPostsByPage, similarPosts, postsForCategory } from "@/repo/posts";
import { getCategoryBySlugOrCode } from "@/repo/reference";
import { listLawyers } from "@/repo/memberships";
import { ConnectBar, ConnectButtons } from "./ConnectBar";
import { AboutSection, CareerSection, CasesSection, CompetitorBlocks, LawyersSection, MemberOfSection, OfficesSection, PostsSection, PracticeSection } from "./Sections";

type P = { data: ProfileData; ctx: ProfileCtx };

export async function OverviewTab({ data, ctx }: P) {
  const { page, district } = data.bundle;
  return (
    <>
      <AboutSection data={data} ctx={ctx} />
      <PracticeSection data={data} ctx={ctx} districtCode={district.code} />
      {page.type === "firm" ? <LawyersSection data={data} ctx={ctx} slug={page.slug} /> : null}
      <OfficesSection data={data} ctx={ctx} slug={page.slug} />
      <CareerSection data={data} ctx={ctx} />
      <CasesSection data={data} ctx={ctx} />
      <MemberOfSection data={data} ctx={ctx} />
      <PostsSection data={data} ctx={ctx} slug={page.slug} />
      <CompetitorBlocks data={data} ctx={ctx} />
      {ctx.mode === "main" ? <p><Link href={`/report?type=page&id=${page.id}`}>{ctx.t("report.link")}</Link></p> : null}
    </>
  );
}

const SIZE = 10;

/** Posts tab. On a Premium domain, ?category= shows own posts first, then the author's others, then colleagues only; it never leaves the domain. */
export async function PostsTab({ data, ctx, pageNo, category }: P & { pageNo: number; category?: string }) {
  const { page } = data.bundle;
  const { t, lang } = ctx;
  const paths = profilePaths(ctx, page.slug);
  const cat = category ? await getCategoryBySlugOrCode(category) : null;
  let list = await listPostsByPage(page.id, { type: "article", categoryId: cat?.id, limit: SIZE + 1, offset: (pageNo - 1) * SIZE });
  let fellBack = false;
  if (cat && list.length === 0 && pageNo === 1) {
    list = await listPostsByPage(page.id, { type: "article", limit: SIZE });
    fellBack = true;
  }
  let colleagues: Awaited<ReturnType<typeof similarPosts>> = [];
  if (cat && ctx.layout === "premium" && page.type === "firm") {
    const ids = (await colleaguePageIds(page.id)).filter((id) => id !== page.id);
    if (ids.length) colleagues = (await postsForCategory(cat.id, 6)).filter((p) => p.pageId && ids.includes(p.pageId));
  }
  const shown = list.slice(0, SIZE);
  const pc = await postContext([...shown, ...colleagues], lang);
  return (
    <section aria-labelledby="sec-posts">
      <h2 id="sec-posts">{t("profile.posts")}{cat ? `: ${data.catNames.get(cat.id) ?? cat.name}` : ""}</h2>
      {fellBack ? <p className="muted">{t("profile.posts_fallback")}</p> : null}
      {shown.length === 0 ? <p className="muted">{t("profile.no_posts")}</p> : (
        <div className="grid g2">{shown.map((p) => <PostCard key={p.id} post={p} author={null} courtName={p.courtId ? pc.courts.get(p.courtId) : null} lang={lang} t={t} href={paths.post(p, seoSlug(p.title))} />)}</div>
      )}
      <Pager page={pageNo} prevHref={pageNo > 1 ? `${paths.posts}?page=${pageNo - 1}` : null} nextHref={list.length > SIZE ? `${paths.posts}?page=${pageNo + 1}` : null} labels={{ next: t("pager.next"), prev: t("pager.prev"), page: t("pager.label") }} />
      {colleagues.length ? (
        <>
          <h3 style={{ marginTop: 20 }}>{t("profile.posts_colleagues")}</h3>
          <div className="grid g2">{colleagues.map((p) => <PostCard key={p.id} post={p} author={p.pageId ? pc.authors.get(p.pageId) : null} courtName={null} lang={lang} t={t} href={`/p/${p.id}/${seoSlug(p.title)}`} />)}</div>
        </>
      ) : null}
    </section>
  );
}

export function OfficesTab({ data, ctx }: P) {
  const { page } = data.bundle;
  if (!data.bundle.offices.length) return <p className="muted">{ctx.t("profile.no_offices")}</p>;
  return <OfficesSection data={data} ctx={ctx} slug={page.slug} />;
}

export async function LawyersTab({ data, ctx }: P) {
  const { page } = data.bundle;
  if (page.type !== "firm") notFound();
  return <LawyersSection data={data} ctx={ctx} slug={page.slug} full />;
}

/** Office page: own number, focus courts, local description, the lawyers at that office. */
export async function OfficePage({ data, ctx, officeId }: P & { officeId: number }) {
  const { page, district } = data.bundle;
  const office = data.bundle.offices.find((o) => o.id === officeId);
  if (!office) notFound();
  const { t, lang } = ctx;
  const paths = profilePaths(ctx, page.slug);
  const lawyers = page.type === "firm" ? await listLawyers(page, { officeId: office.id, forDomain: ctx.mode === "domain" }) : { items: [], hidden: 0 };
  const areas = data.bundle.categories.map((c) => c.name);
  const mapUrl = office.lat != null && office.lng != null ? `https://www.openstreetmap.org/?mlat=${office.lat}&mlon=${office.lng}#map=17/${office.lat}/${office.lng}` : null;
  const connectOffice = office.phone && office.phoneVerified ? office.id : null;
  const hasContact = !!(connectOffice || page.contactMobile);
  return (
    <>
      <JsonLd data={officeJsonLd({
        officeName: office.name, pageName: page.name, url: absolute(ctx.mode === "domain" ? `/o/${office.id}/${seoSlug(office.name)}` : `/${page.slug}/o/${office.id}/${seoSlug(office.name)}`),
        pageUrl: absolute(`/${page.slug}`), image: imageUrl(page.photoKey, "m"), about: office.about,
        office: { address: office.address, locality: office.locality?.name ?? district.name, pincode: office.pincode, lat: office.lat, lng: office.lng, phone: null }, areas,
      })} />
      <section className={ctx.layout === "premium" ? "" : "page-hero"}>
        <div className="container">
          <Breadcrumbs dark={ctx.layout !== "premium"} label={t("crumbs.label")} items={[{ name: t("crumbs.home"), href: withLang("/", lang) }, { name: page.name, href: paths.home }, { name: office.name, href: paths.office(office, seoSlug(office.name)) }]} />
          <h1>{office.name}</h1>
          <p>{page.name}</p>
        </div>
      </section>
      <div className="container section">
        <div className="layout-2">
          <div className="stack">
            <section className="card pad">
              <h2>{t("office.about")}</h2>
              {office.about ? <p>{office.about}</p> : <p className="muted">{t("office.no_about")}</p>}
              {office.courts.length ? (
                <><h3>{t("office.focus_courts")}</h3><ul className="list-clean">{office.courts.map((c) => <li key={c.id}><Icon name="scale" size="sm" />{ctx.mode === "domain" ? localName(lang, c.name, c.localName) : <Link href={courtPath(c, lang)}>{localName(lang, c.name, c.localName)}</Link>}</li>)}</ul></>
              ) : null}
            </section>
            {lawyers.items.length ? (
              <section>
                <h2>{t("office.lawyers")}</h2>
                <div className="grid g2">
                  {lawyers.items.map(({ membership: m, page: p }) => (
                    <article key={m.id} className="lawyer-card">
                      <Avatar name={p.name} photoKey={p.photoKey} size="m" className="ph" />
                      <div><h3 style={{ margin: 0 }}>{p.name}</h3><div className="role">{m.title}</div>{m.intro ? <p className="intro">{m.intro}</p> : null}</div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
          <aside className="aside">
            <div className="card aside-card">
              <h2>{t("office.contact")}</h2>
              <p>{[office.address, office.locality ? localName(lang, office.locality.name, office.locality.localName) : null, office.pincode].filter(Boolean).join(", ")}</p>
              {office.hours ? <p className="muted">{office.hours}</p> : null}
              {hasContact ? <div className="row"><ConnectButtons pageId={page.id} officeId={connectOffice} t={t} /></div> : null}
              {mapUrl ? <p><a href={mapUrl} target="_blank" rel="noopener noreferrer nofollow"><Icon name="pin" size="sm" /> {t("court.map")}</a></p> : null}
            </div>
          </aside>
        </div>
      </div>
      {hasContact ? <ConnectBar pageId={page.id} officeId={connectOffice} t={t} brand={ctx.layout === "premium"} /> : null}
    </>
  );
}
