import Link from "next/link";
import { getT } from "@/lib/ctx";
import { profilePath } from "@/lib/url";
import type { PageRow } from "@/repo/pages";
import { entitlementsFor } from "@/lib/entitlements";
import { PageSwitcher } from "./PageSwitcher";

export async function ManageNav({ page, pages, active }: { page: PageRow; pages: { id: number; name: string }[]; active: string }) {
  const { lang, t } = await getT();
  const ent = entitlementsFor(page.plan);
  const items = [
    { id: "profile", href: `/manage/${page.id}`, label: t("manage.nav.profile") },
    { id: "offices", href: `/manage/${page.id}/offices`, label: t("manage.nav.offices") },
    { id: "associates", href: `/manage/${page.id}/associates`, label: t(page.type === "firm" ? "manage.nav.lawyers" : "manage.nav.firms") },
    { id: "posts", href: `/manage/${page.id}/posts`, label: t("manage.nav.posts") },
    { id: "slug", href: `/manage/${page.id}/slug`, label: t("manage.nav.slug") },
    { id: "domain", href: `/manage/${page.id}/domain`, label: t("manage.nav.domain"), lock: !ent.customDomain },
    { id: "plan", href: `/manage/${page.id}/plan`, label: t("manage.nav.plan") },
  ];
  return (
    <div>
      <PageSwitcher pages={pages} current={page.id} label={t("manage.switch")} />
      <nav className="side" aria-label={t("manage.nav.label")}>
        {items.map((i) => <Link key={i.id} href={i.href} className={active === i.id ? "act" : ""} aria-current={active === i.id ? "page" : undefined}>{i.label}{i.lock ? " 🔒" : ""}</Link>)}
        <Link href={profilePath(page.slug, lang)}>{t("account.view")}</Link>
      </nav>
    </div>
  );
}
