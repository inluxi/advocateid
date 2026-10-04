import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getT } from "@/lib/ctx";
import { requireUser } from "@/lib/auth-guard";
import { MAX_PAGES_PER_ACCOUNT } from "@/lib/entitlements";
import { localName } from "@/lib/i18n";
import { accountPageCount } from "@/repo/pages";
import { listDistricts } from "@/repo/reference";
import { NewPageForm } from "@/components/manage/NewPageForm";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("new.title"), robots: { index: false, follow: false } };
}

export default async function NewPage() {
  const { lang, t } = await getT();
  const session = await requireUser("/manage/new");
  if ((await accountPageCount(session.accountId)) >= MAX_PAGES_PER_ACCOUNT) redirect("/account");
  const districts = await listDistricts();
  return (
    <div className="container section" style={{ maxWidth: 640 }}>
      <h1>{t("new.h1")}</h1>
      <p className="muted">{t("new.intro")}</p>
      <div className="card pad"><NewPageForm districts={districts.map((d) => ({ id: d.id, name: localName(lang, d.name, d.localName) }))} /></div>
    </div>
  );
}
