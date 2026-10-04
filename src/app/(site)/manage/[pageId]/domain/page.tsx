import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/lib/ctx";
import { loadOwned } from "@/lib/manage";
import { entitlementsFor } from "@/lib/entitlements";
import { cnameTarget } from "@/lib/host";
import { getDomainForPage } from "@/repo/domains";
import { ManageNav } from "@/components/manage/ManageNav";
import { DomainManager } from "@/components/manage/DomainManager";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("manage.nav.domain"), robots: { index: false, follow: false } };
}

export default async function ManageDomain({ params }: { params: Promise<{ pageId: string }> }) {
  const { t } = await getT();
  const { page, pages } = await loadOwned((await params).pageId, "/manage");
  const allowed = entitlementsFor(page.plan).customDomain;
  const dom = allowed ? await getDomainForPage(page.id) : null;
  return (
    <div className="app-shell">
      <ManageNav page={page} pages={pages.map((p) => ({ id: p.id, name: p.name }))} active="domain" />
      <div className="stack">
        <h1>{t("manage.nav.domain")}</h1>
        {allowed ? (
          <DomainManager pageId={page.id} slug={page.slug} cnameTarget={cnameTarget(page.slug)} current={dom ? { hostname: dom.hostname, status: dom.status } : null} />
        ) : (
          <div className="upgrade-lock stack"><h2>{t("domain.locked.title")}</h2><p>{t("domain.locked.body")}</p><Link className="btn btn-sm" href="/pricing">{t("nav.pricing")}</Link></div>
        )}
      </div>
    </div>
  );
}
