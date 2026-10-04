import Link from "next/link";
import { getT } from "@/lib/ctx";
import { withLang } from "@/lib/url";

export async function SiteFooter() {
  const { lang, t } = await getT();
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="cols">
          <div>
            <h4>AdvocateID</h4>
            <p>{t("footer.about")}</p>
          </div>
          <div>
            <h4>{t("footer.browse")}</h4>
            <ul>
              <li><Link href={withLang("/search", lang)}>{t("nav.search")}</Link></li>
              <li><Link href={withLang("/practice", lang)}>{t("nav.practice")}</Link></li>
              <li><Link href={withLang("/pricing", lang)}>{t("nav.pricing")}</Link></li>
            </ul>
          </div>
          <div>
            <h4>{t("footer.legal")}</h4>
            <ul>
              <li><Link href="/terms">{t("footer.terms")}</Link></li>
              <li><Link href="/privacy">{t("footer.privacy")}</Link></li>
              <li><Link href="/grievance">{t("footer.grievance")}</Link></li>
              <li><Link href="/report">{t("footer.report")}</Link></li>
              <li><Link href="/contact">{t("footer.contact")}</Link></li>
            </ul>
          </div>
        </div>
        <p className="disclaimer">{t("footer.disclaimer")}</p>
      </div>
    </footer>
  );
}
