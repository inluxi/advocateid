import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { accounts, grievances, pages, reports } from "@/db/schema";
import { getT } from "@/lib/ctx";
import { formatDate } from "@/lib/format";
import { adminTotals } from "@/repo/analytics";
import { listAudit } from "@/repo/moderation";

export const dynamic = "force-dynamic";

/** Admin dashboard: totals for impressions, views and Connect taps per host (aggregates only; no owner dashboard in MVP 1). */
export default async function AdminHome() {
  const { lang, t } = await getT();
  const db = getDb();
  const [totals, audit] = await Promise.all([adminTotals(30), listAudit(15)]);
  const [p] = await db.select({ n: sql<number>`count(*)::int` }).from(pages).where(isNull(pages.deletedAt));
  const [a] = await db.select({ n: sql<number>`count(*)::int` }).from(accounts).where(isNull(accounts.deletedAt));
  const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(reports).where(eq(reports.status, "open"));
  const [g] = await db.select({ n: sql<number>`count(*)::int` }).from(grievances).where(and(sql`${grievances.status} <> 'resolved'`));
  const sum = (k: "impressions" | "views" | "connects") => totals.byHost.reduce((s, h) => s + h[k], 0);
  return (
    <div className="stack">
      <h1>{t("admin.nav.dashboard")}</h1>
      <div className="stat-cards">
        <div className="stat-card"><b>{p?.n ?? 0}</b><span>{t("admin.stat.pages")}</span></div>
        <div className="stat-card"><b>{a?.n ?? 0}</b><span>{t("admin.stat.accounts")}</span></div>
        <div className="stat-card"><b>{r?.n ?? 0}</b><span>{t("admin.stat.reports")}</span></div>
        <div className="stat-card"><b>{g?.n ?? 0}</b><span>{t("admin.stat.grievances")}</span></div>
        <div className="stat-card"><b>{sum("impressions")}</b><span>{t("admin.stat.impressions")}</span></div>
        <div className="stat-card"><b>{sum("views")}</b><span>{t("admin.stat.views")}</span></div>
        <div className="stat-card"><b>{sum("connects")}</b><span>{t("admin.stat.connects")}</span></div>
      </div>
      <section className="card pad"><h2>{t("admin.by_host")}</h2>
        <div className="table-wrap"><table className="table"><thead><tr><th>{t("admin.host")}</th><th>{t("admin.stat.impressions")}</th><th>{t("admin.stat.views")}</th><th>{t("admin.stat.connects")}</th></tr></thead>
          <tbody>{totals.byHost.map((h) => <tr key={h.host}><td>{h.host}</td><td>{h.impressions}</td><td>{h.views}</td><td>{h.connects}</td></tr>)}</tbody></table></div>
        <p className="inline-note">{t("admin.cleaned_note")}</p>
      </section>
      <section className="card pad"><h2>{t("admin.top_pages")}</h2>
        <div className="table-wrap"><table className="table"><thead><tr><th>{t("admin.name")}</th><th>{t("admin.stat.impressions")}</th><th>{t("admin.stat.views")}</th><th>{t("admin.stat.connects")}</th></tr></thead>
          <tbody>{totals.top.map((x) => <tr key={x.pageId}><td>{x.name}</td><td>{x.impressions}</td><td>{x.views}</td><td>{x.connects}</td></tr>)}</tbody></table></div>
      </section>
      <section className="card pad"><h2>{t("admin.audit")}</h2>
        <div className="table-wrap"><table className="table"><thead><tr><th>{t("admin.when")}</th><th>{t("admin.action")}</th><th>{t("admin.resource")}</th><th>{t("admin.reason")}</th></tr></thead>
          <tbody>{audit.map((e) => <tr key={e.id}><td>{formatDate(e.timestamp, lang)}</td><td>{e.action}</td><td>{e.resourceType} {e.resourceId}</td><td>{e.reason}</td></tr>)}</tbody></table></div>
      </section>
    </div>
  );
}
