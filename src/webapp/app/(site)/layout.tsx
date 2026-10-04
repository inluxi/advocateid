import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { CompareTray } from "@/components/layout/CompareTray";
import { InstallPrompt } from "@/components/ui/Pwa";
import { getT } from "@/lib/ctx";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getT();
  return (
    <>
      <a className="skip" href="#main">{t("skip")}</a>
      <SiteHeader />
      <InstallPrompt text={t("install.text")} install={t("install.button")} dismiss={t("install.dismiss")} />
      <main id="main">{children}</main>
      <SiteFooter />
      <CompareTray />
    </>
  );
}
