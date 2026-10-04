import type { Metadata } from "next";
import { getT } from "@/lib/ctx";
import { buildMetadata } from "@/lib/seo";
import { withLang } from "@/lib/url";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, t } = await getT();
  return buildMetadata({ title: t("terms.title"), canonical: withLang("/terms", lang), hreflangPath: "/terms", lang });
}

const SECTIONS = ["use", "content", "bar", "reports", "liability", "changes"];

export default async function TermsPage() {
  const { t } = await getT();
  return (
    <div className="container section prose">
      <h1>{t("terms.h1")}</h1>
      <p className="inline-note">{t("legal.placeholder")}</p>
      {SECTIONS.map((s) => (
        <section key={s}>
          <h2>{t(`terms.${s}.title`)}</h2>
          <p>{t(`terms.${s}.body`)}</p>
        </section>
      ))}
    </div>
  );
}
