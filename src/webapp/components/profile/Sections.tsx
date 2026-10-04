import Link from "next/link";
import { Icon, LINK_ICONS } from "@/components/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { PostCard } from "@/components/cards/PostCards";
import { OUTCOME_LABELS, LANGUAGE_OPTIONS, type Outcome } from "@/lib/outcomes";
import { localName } from "@/lib/i18n";
import { courtPath, searchUrl, profilePath } from "@/lib/url";
import { seoSlug } from "@/lib/text";
import { entitlementsFor } from "@/lib/entitlements";
import { profilePaths, type ProfileCtx, type ProfileData } from "@/lib/profile";
import { postContext } from "@/lib/post-context";
import { AdvocateCard } from "@/components/cards/AdvocateCard";
import { getSavedIds } from "@/lib/request-context";
import { trackImpressions } from "@/lib/impressions";

type Props = { data: ProfileData; ctx: ProfileCtx };

/** Practice-area click: Basic goes to search (source first); Professional to the author's posts; Premium on its own domain stays on the domain. */
export function practiceHref(data: ProfileData, ctx: ProfileCtx, cat: { code: string; slug: string }, districtCode: string): string {
  const { page } = data.bundle;
  if (ctx.layout === "premium") return `/posts?category=${cat.code}`;
  if (entitlementsFor(page.plan).proLayout) return `/posts?author=${page.id}&category=${cat.code}`;
  return searchUrl({ d: districtCode, p: cat.code, first: String(page.id) }, ctx.lang);
}

export function AboutSection({ data, ctx }: Props) {
  const { page } = data.bundle;
  if (!page.bio && !page.about) return null;
  return (
    <section className="card pad" aria-labelledby="sec-about">
      <h2 id="sec-about">{ctx.t("profile.about")}</h2>
      {page.bio ? <p><strong>{page.bio}</strong></p> : null}
      {page.about ? page.about.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>) : null}
    </section>
  );
}

export function PracticeSection({ data, ctx, districtCode }: Props & { districtCode: string }) {
  const { categories, courts } = data.bundle;
  const { t, lang } = ctx;
  if (!categories.length && !courts.length) return null;
  return (
    <section className="card pad" aria-labelledby="sec-practice">
      <h2 id="sec-practice">{t("profile.practice")}</h2>
      {categories.length ? (
        <>
          <h3>{t("profile.areas")}</h3>
          <div className="chips">
            {categories.map((c) => (
              <Link key={c.id} className="chip" href={practiceHref(data, ctx, c, districtCode)}>{data.catNames.get(c.id) ?? c.name}</Link>
            ))}
          </div>
        </>
      ) : null}
      {courts.length ? (
        <>
          <h3 style={{ marginTop: 16 }}>{t("profile.courts")}</h3>
          <ul className="list-clean">
            {courts.map((c) => (
              <li key={c.id}>
                <Icon name="scale" size="sm" />
                {ctx.mode === "domain" ? <span>{localName(lang, c.name, c.localName)}</span> : <Link href={courtPath(c, lang)}>{localName(lang, c.name, c.localName)}</Link>}
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {data.bundle.languages.length ? (
        <p style={{ marginTop: 14 }}><strong>{t("profile.languages")}:</strong> {data.bundle.languages.map((l) => LANGUAGE_OPTIONS.find((o) => o.code === l.code)?.name ?? l.code).join(", ")}</p>
      ) : null}
    </section>
  );
}

export function CareerSection({ data, ctx }: Props) {
  const { career } = data.bundle;
  if (!career.length) return null;
  const years = (e: { yearFrom: number; yearTo: number | null }) => (e.yearTo === e.yearFrom ? String(e.yearFrom) : `${e.yearFrom} – ${e.yearTo ?? ctx.t("profile.present")}`);
  return (
    <section className="card pad" aria-labelledby="sec-career">
      <h2 id="sec-career">{ctx.t("profile.career")}</h2>
      <ol className="timeline">
        {[...career].sort((a, b) => b.yearFrom - a.yearFrom).map((e) => (
          <li key={e.id}>
            <span className="yr">{years(e)}</span>
            <b>{e.title}</b>{e.institution ? <> · {e.institution}</> : null}
            {e.description ? <div className="muted">{e.description}</div> : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

export function CasesSection({ data, ctx }: Props) {
  const { cases } = data.bundle;
  if (!cases.length) return null;
  return (
    <section className="card pad" aria-labelledby="sec-cases">
      <h2 id="sec-cases">{ctx.t("profile.cases")}</h2>
      <p className="inline-note">{ctx.t("profile.cases_note")}</p>
      {cases.map((c) => (
        <div className="case" key={c.id}>
          <b>{c.court ? localName(ctx.lang, c.court.name, c.court.localName) : ""}</b> · {c.year}
          <div>{c.role}. {ctx.t("profile.outcome")}: {OUTCOME_LABELS[c.outcome as Outcome] ?? c.outcome}.</div>
          {c.note ? <div className="muted">{c.note}</div> : null}
          {c.link ? <a href={c.link} rel="nofollow noopener noreferrer" target="_blank">{ctx.t("profile.reference")}</a> : null}
        </div>
      ))}
    </section>
  );
}

export function OfficesSection({ data, ctx, slug }: Props & { slug: string }) {
  const { offices } = data.bundle;
  if (!offices.length) return null;
  const paths = profilePaths(ctx, slug);
  return (
    <section className="card pad" aria-labelledby="sec-offices">
      <h2 id="sec-offices">{ctx.t("profile.offices")}</h2>
      <div className="stack">
        {offices.map((o) => (
          <div key={o.id}>
            <h3><Link href={paths.office(o, seoSlug(o.name))}>{o.name}</Link>{o.isMain ? <span className="chip" style={{ marginLeft: 8 }}>{ctx.t("profile.main_office")}</span> : null}</h3>
            <p className="muted" style={{ margin: 0 }}>{[o.address, o.locality ? localName(ctx.lang, o.locality.name, o.locality.localName) : null, o.pincode].filter(Boolean).join(", ")}</p>
            {o.hours ? <p className="muted" style={{ margin: 0 }}>{o.hours}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export function LinksSection({ data, ctx, dark = false }: Props & { dark?: boolean }) {
  const { links } = data.bundle;
  if (!links.length) return null;
  return (
    <ul className={`linkbar ${dark ? "dark" : ""}`} style={{ listStyle: "none", padding: 0, margin: 0 }} aria-label={ctx.t("profile.links")}>
      {links.map((l) => {
        const icon = LINK_ICONS[l.iconKey];
        let host = "";
        try { host = new URL(l.url).hostname; } catch { /* ignore */ }
        return (
          <li key={l.id}>
            <a className="lnk" href={l.url} rel="nofollow noopener noreferrer" target="_blank" aria-label={l.label || host || l.url} title={l.label || host} style={icon ? ({ "--lc": icon.color } as React.CSSProperties) : undefined}>
              {icon ? <span>{icon.label}</span> : l.iconKey === "favicon" && host ? <img src={`/api/favicon/${host}`} alt="" width={20} height={20} loading="lazy" /> : <Icon name="link" size="sm" />}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export function HighlightsSection({ data, ctx }: Props) {
  const { highlights } = data.bundle;
  if (!highlights.length) return null;
  return (
    <section aria-label={ctx.t("profile.highlights")}>
      <div className="highlights">
        {highlights.map((h) => (
          <div className="highlight" key={h.id}><b>{h.number}</b><span>{h.label}</span></div>
        ))}
      </div>
    </section>
  );
}

export async function PostsSection({ data, ctx, slug }: Props & { slug: string }) {
  if (!data.posts.length) return null;
  const paths = profilePaths(ctx, slug);
  const pc = await postContext(data.posts, ctx.lang);
  return (
    <section aria-labelledby="sec-posts">
      <div className="section-head"><h2 id="sec-posts">{ctx.t("profile.posts")}</h2><Link href={paths.posts}>{ctx.t("profile.all_posts")}</Link></div>
      <div className="grid g2">
        {data.posts.map((p) => (
          <PostCard key={p.id} post={p} author={null} courtName={p.courtId ? pc.courts.get(p.courtId) : null} lang={ctx.lang} t={ctx.t} href={paths.post(p, seoSlug(p.title))} />
        ))}
      </div>
    </section>
  );
}

export function MemberOfSection({ data, ctx }: Props) {
  if (!data.firms.length) return null;
  return (
    <section className="card pad" aria-labelledby="sec-member">
      <h2 id="sec-member">{ctx.t("profile.member_of")}</h2>
      <ul className="list-clean">
        {data.firms.map((f) => (
          <li key={f.membership.id}>
            <Avatar name={f.firm.name} photoKey={f.firm.photoKey} size="s" className="avatar" />
            <span>
              {ctx.mode === "domain" ? f.firm.name : <Link href={profilePath(f.firm.slug, ctx.lang)}>{f.firm.name}</Link>}
              {f.membership.title ? <span className="muted"> · {f.membership.title}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export async function LawyersSection({ data, ctx, slug, full = false }: Props & { slug: string; full?: boolean }) {
  if (!data.lawyers || !data.lawyers.items.length) return null;
  const items = full ? data.lawyers.items : data.lawyers.items.slice(0, 4);
  const paths = profilePaths(ctx, slug);
  const offices = new Map(data.bundle.offices.map((o) => [o.id, o]));
  return (
    <section aria-labelledby="sec-lawyers">
      <div className="section-head"><h2 id="sec-lawyers">{ctx.t("profile.lawyers")}</h2>{!full ? <Link href={paths.lawyers}>{ctx.t("profile.all_lawyers")}</Link> : null}</div>
      <div className="grid g2">
        {items.map(({ membership: m, page: p }) => (
          <article key={m.id} className="lawyer-card">
            <Avatar name={p.name} photoKey={p.photoKey} size="m" className="ph" />
            <div>
              <h3 style={{ margin: 0 }}>{ctx.mode === "domain" ? <Link href={paths.lawyer(p.slug)}>{p.name}</Link> : <Link href={profilePath(p.slug, ctx.lang)}>{p.name}</Link>}</h3>
              <div className="role">{[m.title, m.officeId ? offices.get(m.officeId)?.name : null].filter(Boolean).join(" · ")}</div>
              {m.intro ? <p className="intro">{m.intro}</p> : null}
            </div>
            {p.contactMobile ? (
              <div className="act"><a className="btn btn-wa btn-sm" href={`/connect/${p.id}?via=whatsapp`} rel="nofollow"><Icon name="whatsapp" size="sm" />{ctx.t("connect")}</a></div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export async function CompetitorBlocks({ data, ctx }: Props) {
  if (!data.competitors) return null;
  const { nearby, similar } = data.competitors;
  const { compare, bookmarks } = await getSavedIds();
  await trackImpressions([...nearby, ...similar], "similar");
  return (
    <>
      {nearby.length ? (
        <section className="card pad" aria-labelledby="sec-nearby">
          <h2 id="sec-nearby">{ctx.t("profile.nearby")}</h2>
          <div className="stack">{nearby.map((c) => <AdvocateCard key={c.key} card={c} lang={ctx.lang} t={ctx.t} compare={compare} bookmarks={bookmarks} />)}</div>
        </section>
      ) : null}
      {similar.length ? (
        <section className="card pad" aria-labelledby="sec-similar">
          <h2 id="sec-similar">{ctx.t("profile.similar")}</h2>
          <div className="stack">{similar.map((c) => <AdvocateCard key={c.key} card={c} lang={ctx.lang} t={ctx.t} compare={compare} bookmarks={bookmarks} />)}</div>
        </section>
      ) : null}
    </>
  );
}

