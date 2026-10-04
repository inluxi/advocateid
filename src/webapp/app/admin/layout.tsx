import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/lib/ctx";
import { requireAdmin } from "@/lib/auth-guard";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const { t } = await getT();
  const links = [
    ["/admin", t("admin.nav.dashboard")], ["/admin/courts", t("admin.nav.courts")], ["/admin/updates", t("admin.nav.updates")], ["/admin/reports", t("admin.nav.reports")],
    ["/admin/pages", t("admin.nav.pages")], ["/admin/reference", t("admin.nav.reference")], ["/admin/grievances", t("admin.nav.grievances")],
  ];
  return (
    <>
      <header className="site-header"><div className="container"><Link className="brand" href="/admin">AdvocateID admin</Link><nav className="nav" style={{ display: "flex", flexWrap: "wrap" }} aria-label="Admin">{links.map(([h, l]) => <Link key={h} href={h}>{l}</Link>)}</nav><div className="hdr-actions"><Link className="btn btn-brass btn-sm" href="/">{t("nav.home")}</Link></div></div></header>
      <main id="main" className="container section">{children}</main>
    </>
  );
}
