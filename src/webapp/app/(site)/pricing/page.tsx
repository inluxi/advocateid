import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/lib/ctx";
import { buildMetadata } from "@/lib/seo";
import { PLANS, PLAN_PRICES, entitlementsFor, type Plan } from "@/lib/entitlements";
import { withLang } from "@/lib/url";
import { Icon } from "@/components/Icon";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, t } = await getT();
  return buildMetadata({ title: t("pricing.title"), description: t("pricing.description"), canonical: withLang("/pricing", lang), hreflangPath: "/pricing", lang });
}

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default async function PricingPage() {
  const { t } = await getT();
  const num = (n: number) => (Number.isFinite(n) ? String(n) : t("pricing.unlimited"));
  const rows: { label: string; value: (p: Plan) => string }[] = [
    { label: t("pricing.row.photo"), value: () => t("pricing.yes") },
    { label: t("pricing.row.banner"), value: (p) => (entitlementsFor(p).banner ? t("pricing.yes") : t("pricing.no")) },
    { label: t("pricing.row.bio"), value: () => t("pricing.yes") },
    { label: t("pricing.row.courts"), value: (p) => num(entitlementsFor(p).courts) },
    { label: t("pricing.row.areas"), value: (p) => num(entitlementsFor(p).categories) },
    { label: t("pricing.row.career"), value: (p) => num(entitlementsFor(p).career) },
    { label: t("pricing.row.cases"), value: (p) => num(entitlementsFor(p).caseSummaries) },
    { label: t("pricing.row.offices"), value: (p) => num(entitlementsFor(p).offices) },
    { label: t("pricing.row.lawyers"), value: (p) => num(entitlementsFor(p).lawyers) },
    { label: t("pricing.row.highlights"), value: (p) => (entitlementsFor(p).highlights ? t("pricing.up_to", { n: entitlementsFor(p).highlights }) : t("pricing.no")) },
    { label: t("pricing.row.links"), value: (p) => (entitlementsFor(p).links ? t("pricing.up_to", { n: entitlementsFor(p).links }) : t("pricing.no")) },
    { label: t("pricing.row.seo"), value: () => t("pricing.yes") },
    { label: t("pricing.row.layout"), value: (p) => t(`pricing.layout.${p}`) },
    { label: t("pricing.row.competitors"), value: (p) => (entitlementsFor(p).showCompetitorBlocks ? t("pricing.competitors.shown") : t("pricing.competitors.hidden")) },
    { label: t("pricing.row.approve"), value: (p) => (entitlementsFor(p).approveLawyers ? t("pricing.yes") : t("pricing.no")) },
    { label: t("pricing.row.domain"), value: (p) => (entitlementsFor(p).customDomain ? t("pricing.yes") : t("pricing.no")) },
  ];
  return (
    <div className="container section">
      <h1>{t("pricing.h1")}</h1>
      <p className="muted">{t("pricing.intro")}</p>
      <div className="notice" style={{ marginBottom: 20 }}>{t("pricing.note")}</div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col"><span className="sr-only">{t("pricing.row.feature")}</span></th>
              {PLANS.map((p) => (
                <th scope="col" key={p}>
                  {t(`plan.${p}`)}
                  <div className="muted small">{p === "basic" ? t("pricing.free") : t("pricing.price", { month: inr(PLAN_PRICES[p].month), year: inr(PLAN_PRICES[p].year) })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <th scope="row">{r.label}</th>
                {PLANS.map((p) => <td key={p}>{r.value(p) === t("pricing.yes") ? <><Icon name="check" size="sm" /> {r.value(p)}</> : r.value(p)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="inline-note">{t("pricing.gst")}</p>
      <p><Link className="btn" href="/contact">{t("pricing.cta")}</Link></p>
    </div>
  );
}
