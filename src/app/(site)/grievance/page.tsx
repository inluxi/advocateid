import type { Metadata } from "next";
import { getT } from "@/lib/ctx";
import { buildMetadata } from "@/lib/seo";
import { withLang } from "@/lib/url";
import { PublicForm } from "@/components/ui/PublicForm";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, t } = await getT();
  return buildMetadata({ title: t("grievance.title"), description: t("grievance.description"), canonical: withLang("/grievance", lang), hreflangPath: "/grievance", lang });
}

export default async function GrievancePage() {
  const { t } = await getT();
  const officer = process.env.GRIEVANCE_OFFICER_NAME;
  const email = process.env.GRIEVANCE_OFFICER_EMAIL;
  return (
    <div className="container section" style={{ maxWidth: 720 }}>
      <h1>{t("grievance.h1")}</h1>
      <p>{t("grievance.intro")}</p>
      <div className="card pad" style={{ marginBottom: 20 }}>
        <h2>{t("grievance.officer")}</h2>
        <p>{officer ?? t("grievance.officer_pending")}{email ? ` · ${email}` : ""}</p>
        <p className="inline-note">{t("grievance.timeline")}</p>
      </div>
      <div className="card pad">
        <h2>{t("grievance.form")}</h2>
        <PublicForm
          endpoint="/api/grievance"
          fields={[
            { name: "name", label: t("contact.name"), type: "text", required: true, max: 120 },
            { name: "contact", label: t("contact.contact"), type: "text", required: true, max: 120, hint: t("grievance.contact_hint") },
            { name: "subject", label: t("grievance.subject"), type: "text", required: true, max: 160 },
            { name: "message", label: t("contact.message"), type: "textarea", required: true, max: 3000 },
          ]}
          submitLabel={t("grievance.send")}
          sendingLabel={t("form.sending")}
          successText={t("grievance.sent")}
          captchaLabel={t("form.captcha")}
        />
      </div>
    </div>
  );
}
