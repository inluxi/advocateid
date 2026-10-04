import type { Metadata } from "next";
import { getT } from "@/lib/ctx";
import { buildMetadata } from "@/lib/seo";
import { withLang } from "@/lib/url";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, t } = await getT();
  return buildMetadata({ title: t("privacy.title"), canonical: withLang("/privacy", lang), hreflangPath: "/privacy", lang });
}

const SECTIONS = ["collect", "purpose", "consent", "cookies", "retention", "rights", "children", "processors", "security", "breach"];
const RETENTION = ["mobile", "otp", "pages", "events", "consents", "grievances", "contact"];
const PROCESSORS = ["hosting", "db", "storage", "sms", "dns"];

/** DPDP notice: what is collected, why, how long, rights, processors. Counsel to confirm (T6). */
export default async function PrivacyPage() {
  const { t } = await getT();
  return (
    <div className="container section prose">
      <h1>{t("privacy.h1")}</h1>
      <p className="inline-note">{t("legal.placeholder")}</p>
      <p>{t("privacy.intro")}</p>
      {SECTIONS.map((s) => (
        <section key={s}>
          <h2>{t(`privacy.${s}.title`)}</h2>
          <p>{t(`privacy.${s}.body`)}</p>
          {s === "retention" ? <ul>{RETENTION.map((r) => <li key={r}>{t(`privacy.retention.${r}`)}</li>)}</ul> : null}
          {s === "processors" ? <ul>{PROCESSORS.map((r) => <li key={r}>{t(`privacy.processor.${r}`)}</li>)}</ul> : null}
        </section>
      ))}
    </div>
  );
}
