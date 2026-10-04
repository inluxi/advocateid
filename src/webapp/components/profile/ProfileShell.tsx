import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/ui/JsonLd";
import { CompareToggle, BookmarkButton } from "@/components/ui/ClientActions";
import { entitlementsFor } from "@/lib/entitlements";
import { imageUrl } from "@/lib/storage";
import { localName } from "@/lib/i18n";
import { profilePaths, pageUrl, type ProfileCtx, type ProfileData } from "@/lib/profile";
import { attorneyJsonLd, legalServiceJsonLd } from "@/lib/seo";
import { absolute, districtPath, withLang } from "@/lib/url";
import { yearsSince } from "@/lib/text";
import { getSavedIds } from "@/lib/request-context";
import { ConnectBar, ConnectButtons } from "./ConnectBar";
import { LinksSection, HighlightsSection } from "./Sections";

export type ProfileTab = "overview" | "posts" | "offices" | "lawyers";

const hex = (c: string | null | undefined) => (c && /^#[0-9a-fA-F]{6}$/.test(c) ? c : "#16233F");

/** CSS custom properties that hand the palette to the owner's own colour (Premium, white-label). */
function brandVars(color: string): React.CSSProperties {
  return { "--brand": color, "--brand-dark": color, "--on-brand": "#ffffff" } as React.CSSProperties;
}

export async function ProfileShell({ data, ctx, active, children }: { data: ProfileData; ctx: ProfileCtx; active: ProfileTab; children: React.ReactNode }) {
  const { bundle, lawyers } = data;
  const { page, district } = bundle;
  const { t, lang } = ctx;
  const paths = profilePaths(ctx, page.slug);
  const { compare, bookmarks } = await getSavedIds();
  const ent = entitlementsFor(page.plan);
  const mainOffice = bundle.offices.find((o) => o.isMain) ?? bundle.offices[0];
  const years = page.type === "advocate" ? yearsSince(bundle.yearEnrolled) : yearsSince(bundle.establishedYear);
  const url = pageUrl(page.slug, bundle.activeDomain);
  const jsonOffice = mainOffice ? { address: mainOffice.address, locality: mainOffice.locality?.name, pincode: mainOffice.pincode, lat: mainOffice.lat, lng: mainOffice.lng, phone: null } : undefined;
  const areas = bundle.categories.map((c) => c.name);
  const photo = imageUrl(page.photoKey, "l");
  const ld =
    page.type === "advocate"
      ? attorneyJsonLd({ name: page.name, url, image: photo ? absolute(photo) : null, bio: page.bio, mainOffice: jsonOffice, district: district.name, areas })
      : legalServiceJsonLd({ name: page.name, url, image: imageUrl(page.bannerKey, "l") ?? photo, bio: page.bio, mainOffice: jsonOffice, district: district.name, areas, employees: (lawyers?.items ?? []).map((l) => ({ name: l.page.name, title: l.membership.title, image: imageUrl(l.page.photoKey, "m") })) });

  const tabs: { id: ProfileTab; label: string; href: string }[] = [
    { id: "overview", label: t("profile.tab.overview"), href: paths.home },
    ...(page.type === "firm" ? [{ id: "lawyers" as const, label: t("profile.tab.lawyers"), href: paths.lawyers }] : []),
    { id: "offices", label: t("profile.tab.offices"), href: paths.offices },
    { id: "posts", label: t("profile.tab.posts"), href: paths.posts },
  ];
  const tabNav = (
    <nav className="tabs" aria-label={t("profile.tabs")}>
      {tabs.map((x) => <Link key={x.id} className="tab" aria-current={active === x.id ? "page" : undefined} href={x.href}>{x.label}</Link>)}
    </nav>
  );
  const sub = [page.type === "firm" ? t("card.firm") : t("profile.advocate"), localName(lang, district.name, district.localName)].join(" · ");
  const facts = (
    <ul className="pro-meta" style={{ listStyle: "none", padding: 0 }}>
      {page.type === "advocate" && bundle.enrolmentNo ? <li><span><Icon name="file" size="sm" />{t("profile.enrolment", { no: bundle.enrolmentNo })}</span> <span className="inline-note">({t("profile.declared")})</span></li> : null}
      {page.type === "advocate" && bundle.yearEnrolled ? <li><span><Icon name="calendar" size="sm" />{t("profile.enrolled", { year: bundle.yearEnrolled })}</span></li> : null}
      {page.type === "firm" && bundle.establishedYear ? <li><span><Icon name="calendar" size="sm" />{t("profile.established", { year: bundle.establishedYear })}</span></li> : null}
      {years > 0 ? <li><span><Icon name="clock" size="sm" />{t("card.years", { n: years })}</span></li> : null}
    </ul>
  );
  const actions = (brand: boolean) => (
    <div className="actions row">
      {page.contactMobile ? <ConnectButtons pageId={page.id} t={t} brand={brand} /> : null}
      {ctx.mode === "main" ? <CompareToggle pageId={page.id} initial={compare.includes(page.id)} label={t("compare.tick")} fullMessage={t("compare.full")} /> : null}
      {ctx.mode === "main" ? <BookmarkButton pageId={page.id} initial={bookmarks.includes(page.id)} label={t("bookmark")} /> : null}
    </div>
  );
  const crumbs = [
    { name: t("crumbs.home"), href: withLang("/", lang) },
    { name: localName(lang, district.name, district.localName), href: districtPath(district.code, lang) },
    { name: page.name, href: paths.home },
  ];
  const connectBar = page.contactMobile ? <ConnectBar pageId={page.id} t={t} brand={ctx.layout === "premium"} /> : null;

  /* ------------------------------------------------------------ premium */
  if (ctx.layout === "premium") {
    const color = hex(bundle.custom?.brandColour);
    const banner = ent.banner ? imageUrl(page.bannerKey, "l") : null;
    return (
      <div className="premium" style={brandVars(color)}>
        <header className="own-header">
          <div className="container">
            <Link className="name" href="/">{page.name}</Link>
            <nav aria-label={t("profile.tabs")}>
              {tabs.map((x) => <Link key={x.id} href={x.href}>{x.label}</Link>)}
              <Link href="/contact">{t("profile.tab.contact")}</Link>
            </nav>
          </div>
        </header>
        <section className="own-hero">
          {banner ? <img className="bg" src={banner} alt={bundle.seo?.bannerAlt ?? ""} /> : null}
          <div className="container">
            <div>
              <p className="inline-note" style={{ color: "inherit", opacity: 0.85 }}>{sub}</p>
              <h1>{page.name}</h1>
              {page.bio ? <p className="lead">{page.bio}</p> : null}
              {facts}
              {actions(false)}
              <LinksSection data={data} ctx={ctx} dark />
            </div>
            <Avatar name={page.name} photoKey={page.photoKey} size="l" className="portrait" alt={bundle.seo?.photoAlt} />
          </div>
        </section>
        <div className="container section brand-section">
          <HighlightsSection data={data} ctx={ctx} />
          {tabNav}
          <div className="stack">{children}</div>
        </div>
        <footer className="own-footer">
          <div className="container">
            <strong>{page.name}</strong>
            <div className="legal-footer">
              {/* The only links to advocateid.in: the small legal footer */}
              <span>{t("footer.disclaimer_short")}</span><br />
              <a href={absolute("/terms")} rel="nofollow">{t("footer.terms")}</a>
              <a href={absolute("/privacy")} rel="nofollow">{t("footer.privacy")}</a>
              <a href={absolute(`/report?type=page&id=${page.id}`)} rel="nofollow">{t("footer.report")}</a>
            </div>
          </div>
        </footer>
        {connectBar}
        <JsonLd data={ld} />
      </div>
    );
  }

  /* ---------------------------------------------------------------- pro */
  if (ctx.layout === "pro") {
    const banner = ent.banner ? imageUrl(page.bannerKey, "l") : null;
    return (
      <>
        <section className="masthead">
          {banner ? <img className="banner" src={banner} alt={bundle.seo?.bannerAlt ?? ""} /> : null}
          <div className="container">
            <Avatar name={page.name} photoKey={page.photoKey} size="m" className="avatar-lg" alt={bundle.seo?.photoAlt} />
            <div>
              <Breadcrumbs items={crumbs} dark label={t("crumbs.label")} />
              <h1>{page.name}</h1>
              <div className="sub">{sub}</div>
              {facts}
            </div>
            {actions(false)}
          </div>
        </section>
        <div className="container">
          {bundle.highlights.length ? <div style={{ marginTop: 16 }}><HighlightsSection data={data} ctx={ctx} /></div> : null}
          {tabNav}
          <div className="stack" style={{ paddingBottom: 24 }}>
            <LinksSection data={data} ctx={ctx} />
            {children}
          </div>
        </div>
        {connectBar}
        <JsonLd data={ld} />
      </>
    );
  }

  /* -------------------------------------------------------------- basic */
  return (
    <>
      <section className="plain-head">
        <div className="container">
          <Avatar name={page.name} photoKey={page.photoKey} size="m" className="avatar-lg" alt={bundle.seo?.photoAlt} />
          <div>
            <Breadcrumbs items={crumbs} label={t("crumbs.label")} />
            <h1 style={{ marginBottom: 4 }}>{page.name}</h1>
            <div className="muted">{sub}</div>
            {facts}
          </div>
          {actions(false)}
        </div>
      </section>
      <div className="container section tight">
        {tabNav}
        <div className="stack">{children}</div>
      </div>
      {connectBar}
      <JsonLd data={ld} />
    </>
  );
}
