import Link from "next/link";
import { getT } from "@/lib/ctx";
import { countCourts, listCourts } from "@/repo/reference";
import { CourtImport } from "@/components/admin/AdminForms";

export const dynamic = "force-dynamic";
const SIZE = 50;

export default async function AdminCourts({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { t } = await getT();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const [rows, total] = await Promise.all([listCourts({ q: sp.q, limit: SIZE, offset: (page - 1) * SIZE }), countCourts()]);
  return (
    <div className="stack">
      <h1>{t("admin.nav.courts")} ({total})</h1>
      <CourtImport />
      <form method="get" className="inline-form"><div><label className="lbl" htmlFor="cq">{t("search.q")}</label><input id="cq" name="q" defaultValue={sp.q ?? ""} /></div><button className="btn" type="submit">{t("search.apply")}</button></form>
      <div className="table-wrap"><table className="table"><thead><tr><th>#</th><th>{t("admin.courts.name")}</th><th>{t("admin.courts.kind")}</th><th>{t("admin.code")}</th><th /></tr></thead>
        <tbody>{rows.map((c) => <tr key={c.id}><td>{c.id}</td><td>{c.name}</td><td>{c.kind}</td><td>{c.code}</td><td><Link className="btn btn-sm btn-outline" href={`/admin/courts/${c.id}`}>{t("list.edit")}</Link></td></tr>)}</tbody></table></div>
      <div className="row">{page > 1 ? <Link className="btn btn-sm btn-outline" href={`/admin/courts?page=${page - 1}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}`}>{t("pager.prev")}</Link> : null}{rows.length === SIZE ? <Link className="btn btn-sm btn-outline" href={`/admin/courts?page=${page + 1}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}`}>{t("pager.next")}</Link> : null}</div>
    </div>
  );
}
