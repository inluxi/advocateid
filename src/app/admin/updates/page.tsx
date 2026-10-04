import Link from "next/link";
import { getT } from "@/lib/ctx";
import { formatDate } from "@/lib/format";
import { latestCourtUpdates } from "@/repo/posts";
import { updatePath } from "@/lib/url";
import { UpdateForm } from "@/components/admin/AdminForms";

export const dynamic = "force-dynamic";

export default async function AdminUpdates() {
  const { lang, t } = await getT();
  const list = await latestCourtUpdates(30);
  return (
    <div className="stack">
      <h1>{t("admin.nav.updates")}</h1>
      <p className="muted">{t("admin.updates.hint")}</p>
      <UpdateForm />
      <section className="card pad"><h2>{t("admin.updates.recent")}</h2><ul className="bullets">{list.map((u) => <li key={u.id}><Link href={updatePath(u, lang)}>{u.title}</Link> · {formatDate(u.createdAt, lang)} · {u.pageId ? t("update.contributed_by", { name: `#${u.pageId}` }) : t("update.official")}</li>)}</ul></section>
    </div>
  );
}
