import type { Metadata } from "next";
import { getT } from "@/lib/ctx";
import { loadOwned } from "@/lib/manage";
import { entitlementsFor, limitFor } from "@/lib/entitlements";
import { imageUrl } from "@/lib/storage";
import { LANGUAGE_OPTIONS, OUTCOME_LABELS, type Outcome } from "@/lib/outcomes";
import { maskMobile } from "@/lib/phone";
import { loadBundle } from "@/repo/pages";
import { listCategories, listDistricts } from "@/repo/reference";
import { ManageNav } from "@/components/manage/ManageNav";
import { ProfileForm } from "@/components/manage/ProfileForm";
import { ImageUploader } from "@/components/manage/ImageUploader";
import { ContactNumber } from "@/components/manage/ContactNumber";
import { ListEditor, type EditorItem } from "@/components/manage/ListEditor";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("manage.title"), robots: { index: false, follow: false } };
}

const lim = (plan: string, key: Parameters<typeof limitFor>[1]) => { const n = limitFor(plan, key); return Number.isFinite(n) ? n : null; };

export default async function ManageProfilePage({ params }: { params: Promise<{ pageId: string }> }) {
  const { t } = await getT();
  const { page, pages } = await loadOwned((await params).pageId, "/manage");
  const [b, cats, districts] = await Promise.all([loadBundle(page, { forOwner: true }), listCategories(), listDistricts()]);
  const ent = entitlementsFor(page.plan);
  const years = (e: { yearFrom: number; yearTo: number | null }) => `${e.yearFrom} – ${e.yearTo ?? t("profile.present")}`;
  const items = {
    courts: b.courts.map((c): EditorItem => ({ id: c.itemId, title: c.name, subtitle: c.kind, raw: {} })),
    categories: b.categories.map((c): EditorItem => ({ id: c.itemId, title: c.name, raw: {} })),
    languages: b.languages.map((l): EditorItem => ({ id: l.id, title: LANGUAGE_OPTIONS.find((o) => o.code === l.code)?.name ?? l.code, raw: {} })),
    career: b.career.map((c): EditorItem => ({ id: c.id, title: c.title, subtitle: `${years(c)}${c.institution ? ` · ${c.institution}` : ""}`, raw: { yearFrom: c.yearFrom, yearTo: c.yearTo ?? "", title: c.title, institution: c.institution ?? "", description: c.description ?? "" } })),
    highlights: b.highlights.map((h): EditorItem => ({ id: h.id, title: `${h.number} ${h.label}`, raw: { number: h.number, label: h.label } })),
    links: b.links.map((l): EditorItem => ({ id: l.id, title: l.label || l.url, subtitle: l.label ? l.url : undefined, raw: { url: l.url, label: l.label ?? "" } })),
    cases: b.cases.map((c): EditorItem => ({ id: c.id, title: `${c.court?.name ?? ""} · ${c.year}`, subtitle: `${c.role} · ${OUTCOME_LABELS[c.outcome as Outcome] ?? c.outcome}`, raw: { court: c.court ? { id: c.court.id, name: c.court.name } : null, role: c.role, year: c.year, outcome: c.outcome, note: c.note ?? "", link: c.link ?? "" } })),
  };
  const catOptions = cats.map((c) => ({ id: c.id, name: c.name }));
  const sections: { id: string; title: string; hint?: string; node: React.ReactNode }[] = [
    { id: "courts", title: t("editor.courts"), node: <ListEditor pageId={page.id} kind="courts" items={items.courts} limit={lim(page.plan, "courts")} /> },
    { id: "areas", title: t("editor.areas"), node: <ListEditor pageId={page.id} kind="categories" items={items.categories} limit={lim(page.plan, "categories")} options={{ categories: catOptions }} /> },
    { id: "languages", title: t("editor.languages"), node: <ListEditor pageId={page.id} kind="languages" items={items.languages} limit={null} /> },
    { id: "career", title: t("editor.career"), node: <ListEditor pageId={page.id} kind="career" items={items.career} limit={lim(page.plan, "career")} /> },
    { id: "cases", title: t("editor.cases"), hint: t("editor.cases_hint"), node: <ListEditor pageId={page.id} kind="cases" items={items.cases} limit={lim(page.plan, "caseSummaries")} /> },
    { id: "highlights", title: t("editor.highlights"), hint: t("editor.highlights_hint"), node: <ListEditor pageId={page.id} kind="highlights" items={items.highlights} limit={lim(page.plan, "highlights")} /> },
    { id: "links", title: t("editor.links"), hint: t("editor.links_hint"), node: <ListEditor pageId={page.id} kind="links" items={items.links} limit={lim(page.plan, "links")} /> },
  ];
  return (
    <div className="app-shell">
      <ManageNav page={page} pages={pages.map((p) => ({ id: p.id, name: p.name }))} active="profile" />
      <div className="stack">
        <h1>{page.name}</h1>
        <p className="muted">{t("editor.completeness", { n: page.completeness })}</p>
        <nav className="secnav" aria-label={t("editor.sections")}>
          <a className="btn btn-sm btn-outline" href="#sec-profile">{t("manage.nav.profile")}</a>
          {sections.map((s) => <a key={s.id} className="btn btn-sm btn-outline" href={`#sec-${s.id}`}>{s.title}</a>)}
        </nav>
        <section id="sec-profile" className="card pad stack">
          <h2>{t("manage.nav.profile")}</h2>
          <ImageUploader pageId={page.id} kind="photo" currentUrl={imageUrl(page.photoKey, "s")} label={t("editor.photo")} hint={t("editor.photo_hint")} />
          <ImageUploader pageId={page.id} kind="banner" currentUrl={imageUrl(page.bannerKey, "s")} label={t("editor.banner")} hint={t("editor.banner_hint")} locked={ent.banner ? undefined : t("editor.banner_locked")} />
          <ContactNumber pageId={page.id} shown={page.contactMobile ? maskMobile(page.contactMobile) : "-"} />
          <ProfileForm
            districts={districts.map((d) => ({ id: d.id, name: d.name }))}
            initial={{
              id: page.id, type: page.type as "advocate" | "firm", plan: page.plan, name: page.name, bio: page.bio ?? "", about: page.about ?? "", districtId: page.districtId,
              language: page.language as "en" | "ml", enrolmentNo: b.enrolmentNo ?? "", yearEnrolled: b.yearEnrolled, establishedYear: b.establishedYear,
              seoTitle: b.seo?.title ?? "", seoDescription: b.seo?.description ?? "", photoAlt: b.seo?.photoAlt ?? "", bannerAlt: b.seo?.bannerAlt ?? "",
              brandColour: b.custom?.brandColour ?? "", showMemberOf: b.custom?.showMemberOf ?? true, allowMembers: b.custom?.allowMembers ?? true,
              canBrand: ent.premiumLayout, canToggleMemberOf: ent.memberOfToggle, canApprove: ent.approveLawyers,
            }}
          />
        </section>
        {sections.map((s) => (
          <section key={s.id} id={`sec-${s.id}`} className="card pad stack">
            <h2>{s.title}</h2>
            {s.hint ? <p className="inline-note">{s.hint}</p> : null}
            {s.node}
          </section>
        ))}
      </div>
    </div>
  );
}
