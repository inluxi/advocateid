import Link from "next/link";
import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { pages } from "@/db/schema";
import { getT } from "@/lib/ctx";
import { escapeLike } from "@/lib/text";
import { profilePath } from "@/lib/url";
import { PageAdmin } from "@/components/admin/AdminForms";

export const dynamic = "force-dynamic";

export default async function AdminPages({ searchParams }: { searchParams: Promise<{ q?: string; id?: string }> }) {
  const { t } = await getT();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();
  const id = Number(sp.id) || null;
  const rows = await getDb()
    .select()
    .from(pages)
    .where(and(isNull(pages.deletedAt), id ? eq(pages.id, id) : q ? or(sql`lower(${pages.name}) like ${`%${escapeLike(q)}%`} escape '\\'`, sql`${pages.slug} like ${`%${escapeLike(q)}%`} escape '\\'`) : undefined))
    .orderBy(desc(pages.id))
    .limit(40);
  return (
    <div className="stack">
      <h1>{t("admin.nav.pages")}</h1>
      <p className="muted">{t("admin.pages.hint")}</p>
      <form method="get" className="inline-form"><div><label className="lbl" htmlFor="pq">{t("search.q")}</label><input id="pq" name="q" defaultValue={sp.q ?? ""} /></div><button className="btn" type="submit">{t("search.apply")}</button></form>
      {rows.map((p) => (
        <article key={p.id} className="card pad stack">
          <div className="row between"><h2 style={{ margin: 0 }}><Link href={profilePath(p.slug)}>{p.name}</Link> <span className="muted small">#{p.id} · /{p.slug} · {p.type}</span></h2><span className={`pill ${p.status === "active" ? "ok" : "bad"}`}>{t(`status.${p.status}`)}</span></div>
          {p.suspendedReason ? <p className="muted">{p.suspendedReason}</p> : null}
          <PageAdmin id={p.id} plan={p.plan} status={p.status} slug={p.slug} />
        </article>
      ))}
    </div>
  );
}
