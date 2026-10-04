import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/lib/ctx";
import { loadOwned } from "@/lib/manage";
import { PLAN_PRICES, entitlementsFor, limitFor, type ListKey, type Plan } from "@/lib/entitlements";
import { loadBundle } from "@/repo/pages";
import { listLawyers } from "@/repo/memberships";
import { ManageNav } from "@/components/manage/ManageNav";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("manage.nav.plan"), robots: { index: false, follow: false } };
}

/** Plan is assigned by AdvocateID in MVP 1 (payments come later). Nothing here affects ranking. */
export default async function ManagePlan({ params }: { params: Promise<{ pageId: string }> }) {
  const { t } = await getT();
  const { page, pages } = await loadOwned((await params).pageId, "/manage");
  const b = await loadBundle(page, { forOwner: true });
  const lawyers = page.type === "firm" ? (await listLawyers(page, { forOwner: true })).items.length : 0;
  const ent = entitlementsFor(page.plan);
  const usage: { key: ListKey; label: string; used: number }[] = [
    { key: "courts", label: t("editor.courts"), used: b.courts.length },
    { key: "categories", label: t("editor.areas"), used: b.categories.length },
    { key: "career", label: t("editor.career"), used: b.career.length },
    { key: "caseSummaries", label: t("editor.cases"), used: b.cases.length },
    { key: "offices", label: t("manage.nav.offices"), used: b.offices.length },
    ...(page.type === "firm" ? [{ key: "lawyers" as const, label: t("manage.nav.lawyers"), used: lawyers }] : []),
    { key: "highlights", label: t("editor.highlights"), used: b.highlights.length },
    { key: "links", label: t("editor.links"), used: b.links.length },
  ];
  const price = PLAN_PRICES[page.plan as Plan];
  return (
    <div className="app-shell">
      <ManageNav page={page} pages={pages.map((p) => ({ id: p.id, name: p.name }))} active="plan" />
      <div className="stack">
        <h1>{t("manage.nav.plan")}</h1>
        <section className="card pad stack">
          <h2>{t(`plan.${page.plan}`)}</h2>
          <p className="muted">{page.plan === "basic" ? t("pricing.free") : t("pricing.price", { month: `₹${price.month}`, year: `₹${price.year}` })}</p>
          <p>{t("plan.assigned")}</p>
          <Link className="btn btn-sm" href="/contact">{t("pricing.cta")}</Link>
        </section>
        <section className="card pad stack">
          <h2>{t("plan.usage")}</h2>
          {usage.map((u) => {
            const limit = limitFor(page.plan, u.key);
            const finite = Number.isFinite(limit);
            return (
              <div key={u.key}>
                <div className="limit"><span>{u.label}</span><span>{u.used} / {finite ? limit : t("pricing.unlimited")}</span></div>
                <div className={`meter ${finite && u.used >= limit ? "full" : ""}`}><i style={{ width: finite ? `${limit === 0 ? 0 : Math.min(100, (u.used / limit) * 100)}%` : "10%" }} /></div>
                {finite && u.used > limit ? <p className="inline-note">{t("plan.hidden_note", { n: u.used - limit })}</p> : null}
              </div>
            );
          })}
        </section>
        <section className="card pad">
          <h2>{t("plan.features")}</h2>
          <ul className="bullets">
            <li>{ent.banner ? t("plan.f.banner") : t("plan.f.no_banner")}</li>
            <li>{ent.showCompetitorBlocks ? t("plan.f.competitors_shown") : t("plan.f.competitors_hidden")}</li>
            <li>{ent.customDomain ? t("plan.f.domain") : t("plan.f.no_domain")}</li>
          </ul>
          <p className="inline-note">{t("plan.downgrade_note")}</p>
        </section>
      </div>
    </div>
  );
}
