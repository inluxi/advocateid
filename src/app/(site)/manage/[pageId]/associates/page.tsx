import type { Metadata } from "next";
import { getT } from "@/lib/ctx";
import { loadOwned } from "@/lib/manage";
import { limitFor } from "@/lib/entitlements";
import { loadBundle } from "@/repo/pages";
import { listFirmsOf, listLawyers, pendingFor } from "@/repo/memberships";
import { ManageNav } from "@/components/manage/ManageNav";
import { AdvocateAssociates, FirmAssociates, type PendingRow } from "@/components/manage/AssociatesManager";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("manage.nav.lawyers"), robots: { index: false, follow: false } };
}

export default async function ManageAssociates({ params }: { params: Promise<{ pageId: string }> }) {
  const { t } = await getT();
  const { page, pages } = await loadOwned((await params).pageId, "/manage");
  const pend = await pendingFor([page.id]);
  const pending: PendingRow[] = [
    ...pend.requests.map((r) => ({ id: r.id, kind: "request" as const, label: t("account.request_text", { advocate: r.advocateName, firm: r.firmName, title: r.title ?? "" }) })),
    ...pend.invites.map((r) => ({ id: r.id, kind: "invite" as const, label: t("account.invite_text", { firm: r.firmName, advocate: r.advocateName, title: r.title ?? "" }) })),
  ];
  const nav = <ManageNav page={page} pages={pages.map((p) => ({ id: p.id, name: p.name }))} active="associates" />;
  if (page.type === "firm") {
    const [b, all] = await Promise.all([loadBundle(page, { forOwner: true }), listLawyers(page, { forOwner: true })]);
    const limit = limitFor(page.plan, "lawyers");
    const rows = all.items.map((l, i) => ({ membershipId: l.membership.id, name: l.page.name, slug: l.page.slug, title: l.membership.title ?? "", officeId: l.membership.officeId, intro: l.membership.intro ?? "", beyond: Number.isFinite(limit) && i >= limit }));
    return (
      <div className="app-shell">
        {nav}
        <div className="stack">
          <h1>{t("manage.nav.lawyers")}</h1>
          <FirmAssociates pageId={page.id} lawyers={rows} offices={b.offices.map((o) => ({ id: o.id, name: o.name }))} pending={pending} slotsLeft={!Number.isFinite(limit) || rows.length < limit} limitLabel={t("assoc.limit", { used: rows.length, limit: Number.isFinite(limit) ? limit : t("pricing.unlimited") })} />
        </div>
      </div>
    );
  }
  const firms = await listFirmsOf(page.id);
  return (
    <div className="app-shell">
      {nav}
      <div className="stack">
        <h1>{t("manage.nav.firms")}</h1>
        <AdvocateAssociates pageId={page.id} pending={pending} firms={firms.map((f) => ({ membershipId: f.membership.id, firmName: f.firm.name, firmSlug: f.firm.slug, title: f.membership.title ?? "", hideOnDomain: f.membership.hideOnDomain }))} />
      </div>
    </div>
  );
}
