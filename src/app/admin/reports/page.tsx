import Link from "next/link";
import { getT } from "@/lib/ctx";
import { formatDate } from "@/lib/format";
import { listReports } from "@/repo/moderation";
import { ReportActions } from "@/components/admin/AdminForms";

export const dynamic = "force-dynamic";

export default async function AdminReports() {
  const { lang, t } = await getT();
  const rows = await listReports("open", 100);
  const href = (type: string, id: number) => (type === "page" ? `/admin/pages?id=${id}` : type === "post" ? `/post/${id}/x` : `/u/${id}/x`);
  return (
    <div className="stack">
      <h1>{t("admin.nav.reports")} ({rows.length})</h1>
      {rows.length === 0 ? <p className="muted">{t("admin.reports.none")}</p> : rows.map((r) => (
        <article key={r.id} className="card pad stack">
          <div className="row between"><strong>{t(`report.reason.${r.reason}`)}</strong><span className="muted">{formatDate(r.createdAt, lang)}</span></div>
          <p>{r.targetType} <Link href={href(r.targetType, r.targetId)}>#{r.targetId}</Link></p>
          {r.details ? <p className="muted">{r.details}</p> : null}
          <ReportActions id={r.id} targetType={r.targetType} targetId={r.targetId} />
        </article>
      ))}
    </div>
  );
}
