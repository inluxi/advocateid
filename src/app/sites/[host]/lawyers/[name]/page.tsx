import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { domainMeta, loadDomainSite, requireDomainSite, trackView } from "@/lib/domain-site";
import { buildMetadata } from "@/lib/seo";
import { imageUrl } from "@/lib/storage";
import { seoSlug } from "@/lib/text";
import { loadBundle } from "@/repo/pages";
import { listLawyers } from "@/repo/memberships";
import { colleaguePageIds, listPostsByPage } from "@/repo/posts";
import { categoryNames } from "@/repo/reference";
import { ProfileShell } from "@/components/profile/ProfileShell";
import { PostCard } from "@/components/cards/PostCards";
import { Avatar } from "@/components/ui/Avatar";
import { ConnectButtons } from "@/components/profile/ConnectBar";
import { localName } from "@/lib/i18n";
import type { ProfileCtx, ProfileData } from "@/lib/profile";
import { AboutSection, CareerSection, PracticeSection } from "@/components/profile/Sections";

type Props = { params: Promise<{ host: string; name: string }> };

async function findLawyer(firm: { id: number } & Parameters<typeof listLawyers>[0], name: string) {
  const { items } = await listLawyers(firm, { forDomain: true });
  return items.find((l) => l.page.slug === name) ?? null;
}

/** In-domain lawyer page built from the database. Membership approval is consent; the lawyer can hide themselves from the firm's domain. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { host, name } = await params;
  const s = await loadDomainSite(host);
  const lawyer = s && s.page.type === "firm" ? await findLawyer(s.page, name) : null;
  if (!s || !lawyer) return { robots: { index: false } };
  const base = await domainMeta(host, "lawyers", { title: lawyer.page.name, description: lawyer.membership.intro ?? lawyer.page.bio });
  return { ...base, ...buildMetadata({ title: `${lawyer.page.name} | ${s.page.name}`, description: lawyer.membership.intro ?? lawyer.page.bio, canonical: `https://${s.hostname}/lawyers/${lawyer.page.slug}`, noindex: s.targetHost, image: imageUrl(lawyer.page.photoKey, "l"), skipAlternates: true }) };
}

export default async function DomainLawyer({ params }: Props) {
  const { host, name } = await params;
  const { page, ctx, data } = await requireDomainSite(host);
  if (page.type !== "firm") notFound();
  const lawyer = await findLawyer(page, name);
  if (!lawyer) notFound();
  await trackView(page);
  const lb = await loadBundle(lawyer.page);
  const lData: ProfileData = { ...data, bundle: lb, lawyers: null, firms: [], posts: [], competitors: null };
  const lCtx: ProfileCtx = ctx;
  const [colleagues, colleagueIds, names] = await Promise.all([listLawyers(page, { forDomain: true }), colleaguePageIds(page.id), categoryNames(ctx.lang)]);
  const posts = (await Promise.all([lawyer.page.id, ...colleagueIds.filter((id) => id !== lawyer.page.id)].slice(0, 6).map((id) => listPostsByPage(id, { type: "article", limit: 2 })))).flat().slice(0, 4);
  const { t, lang } = ctx;
  return (
    <ProfileShell data={data} ctx={ctx} active="lawyers">
      <section className="card pad">
        <div className="row">
          <Avatar name={lawyer.page.name} photoKey={lawyer.page.photoKey} size="m" className="avatar-lg" />
          <div>
            <h1 style={{ margin: 0 }}>{lawyer.page.name}</h1>
            <div className="role">{lawyer.membership.title}</div>
            {lawyer.membership.intro ? <p>{lawyer.membership.intro}</p> : null}
            {lawyer.page.contactMobile ? <div className="row"><ConnectButtons pageId={lawyer.page.id} t={t} brand /></div> : null}
          </div>
        </div>
      </section>
      <AboutSection data={lData} ctx={lCtx} />
      <PracticeSection data={lData} ctx={lCtx} districtCode={lb.district.code} />
      <CareerSection data={lData} ctx={lCtx} />
      {colleagues.items.filter((c) => c.page.id !== lawyer.page.id).length ? (
        <section className="card pad">
          <h2>{t("lawyer.colleagues")}</h2>
          <ul className="list-clean">{colleagues.items.filter((c) => c.page.id !== lawyer.page.id).map((c) => <li key={c.membership.id}><Link href={`/lawyers/${c.page.slug}`}>{c.page.name}</Link><span className="muted"> · {c.membership.title}</span></li>)}</ul>
        </section>
      ) : null}
      {posts.length ? (
        <section>
          <h2>{t("lawyer.posts")}</h2>
          <div className="grid g2">{posts.map((p) => <PostCard key={p.id} post={p} author={null} courtName={null} lang={lang} t={t} href={`/p/${p.id}/${seoSlug(p.title)}`} />)}</div>
        </section>
      ) : null}
      <p className="inline-note">{localName(lang, lb.district.name, lb.district.localName)}</p>
    </ProfileShell>
  );
}
