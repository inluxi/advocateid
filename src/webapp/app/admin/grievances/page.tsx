import { getT } from "@/lib/ctx";
import { formatDate } from "@/lib/format";
import { listContactMessages, listGrievances } from "@/repo/moderation";
import { GrievanceStatus } from "@/components/admin/AdminForms";

export const dynamic = "force-dynamic";

export default async function AdminGrievances() {
  const { lang, t } = await getT();
  const [g, c] = await Promise.all([listGrievances(100), listContactMessages(50)]);
  return (
    <div className="stack">
      <h1>{t("admin.nav.grievances")}</h1>
      {g.map((x) => (
        <article key={x.id} className="card pad stack">
          <div className="row between"><strong>G-{x.id} · {x.subject}</strong><GrievanceStatus id={x.id} status={x.status} /></div>
          <p className="muted">{x.name} · {x.contact} · {formatDate(x.createdAt, lang)}</p>
          <p>{x.message}</p>
        </article>
      ))}
      <h2>{t("admin.contact_messages")}</h2>
      {c.map((x) => <article key={x.id} className="card pad"><strong>{t(`contact.kind.${x.kind === "court_request" ? "court" : "general"}`)}</strong> · {x.name} · {x.contact} · {formatDate(x.createdAt, lang)}<p>{x.message}</p></article>)}
    </div>
  );
}
