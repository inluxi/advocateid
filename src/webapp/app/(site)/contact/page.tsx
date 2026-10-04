import type { Metadata } from "next";
import { getT } from "@/lib/ctx";
import { buildMetadata } from "@/lib/seo";
import { withLang } from "@/lib/url";
import { PublicForm } from "@/components/ui/PublicForm";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, t } = await getT();
  return buildMetadata({ title: t("contact.title"), description: t("contact.description"), canonical: withLang("/contact", lang), hreflangPath: "/contact", lang });
}

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const { t } = await getT();
  const kind = (await searchParams).kind === "court_request" ? "court_request" : "general";
  return (
    <div className="container section" style={{ maxWidth: 720 }}>
      <h1>{t("contact.h1")}</h1>
      <p className="muted">{t("contact.intro")}</p>
      <div className="card pad">
        <PublicForm
          endpoint="/api/contact"
          fields={[
            { name: "kind", label: t("contact.kind"), type: "select", defaultValue: kind, options: [{ value: "general", label: t("contact.kind.general") }, { value: "court_request", label: t("contact.kind.court") }] },
            { name: "name", label: t("contact.name"), type: "text", required: true, max: 120 },
            { name: "contact", label: t("contact.contact"), type: "text", required: true, max: 120, hint: t("contact.contact_hint") },
            { name: "message", label: t("contact.message"), type: "textarea", required: true, max: 2000 },
          ]}
          submitLabel={t("contact.send")}
          sendingLabel={t("form.sending")}
          successText={t("contact.sent")}
          captchaLabel={t("form.captcha")}
        />
        <p className="inline-note">{t("contact.retention")}</p>
      </div>
    </div>
  );
}
