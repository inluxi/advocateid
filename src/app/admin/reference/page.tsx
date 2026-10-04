import { getT } from "@/lib/ctx";
import { listCategories, listDistricts } from "@/repo/reference";
import { getDb } from "@/db/client";
import { localities } from "@/db/schema";
import { isNull } from "drizzle-orm";
import { CategoryForm, LocalityForm } from "@/components/admin/AdminForms";

export const dynamic = "force-dynamic";

export default async function AdminReference() {
  const { t } = await getT();
  const [cats, districts, all] = await Promise.all([listCategories(), listDistricts(), getDb().select().from(localities).where(isNull(localities.deletedAt))]);
  const parents = [...districts, ...all.filter((l) => l.level === "city")].map((l) => ({ id: l.id, name: l.name }));
  return (
    <div className="stack">
      <h1>{t("admin.nav.reference")}</h1>
      <CategoryForm />
      <section className="card pad"><h2>{t("nav.practice")} ({cats.length})</h2><ul className="bullets">{cats.map((c) => <li key={c.id}>{c.code} · {c.slug} · {c.name}</li>)}</ul></section>
      <LocalityForm parents={parents} />
      <section className="card pad"><h2>{t("admin.localities")} ({all.length})</h2><div className="table-wrap"><table className="table"><thead><tr><th>{t("admin.code")}</th><th>{t("admin.name")}</th><th>{t("admin.level")}</th></tr></thead><tbody>{all.map((l) => <tr key={l.id}><td>{l.code}</td><td>{l.name}</td><td>{l.level}</td></tr>)}</tbody></table></div></section>
    </div>
  );
}
