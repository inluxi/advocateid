import type { Metadata } from "next";
import { getT } from "@/lib/ctx";
import { buildMetadata } from "@/lib/seo";
import { withLang } from "@/lib/url";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, t } = await getT();
  return buildMetadata({ title: t("about.title"), description: t("about.description"), canonical: withLang("/about", lang), hreflangPath: "/about", lang });
}

export default async function AboutPage() {
  const { t } = await getT();
  return (
    <div className="container section prose">
      <h1>{t("about.h1")}</h1>
      <p>{t("about.p1")}</p>
      <p>{t("about.p2")}</p>
      <h2>{t("about.rules.title")}</h2>
      <p>{t("about.rules.body")}</p>
      <h2>{t("about.how.title")}</h2>
      <ul>
        <li>{t("about.how.1")}</li>
        <li>{t("about.how.2")}</li>
        <li>{t("about.how.3")}</li>
      </ul>
      <p className="inline-note">{t("legal.placeholder")}</p>
    </div>
  );
}
