import type { Metadata } from "next";
import { getT } from "@/lib/ctx";
import { buildMetadata } from "@/lib/seo";
import { withLang } from "@/lib/url";
import { PublicForm } from "@/components/ui/PublicForm";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, t } = await getT();
  return buildMetadata({ title: t("report.title"), description: t("report.description"), canonical: withLang("/report", lang), noindex: true, lang });
}

const TYPES = ["page", "post", "update"] as const;

/** Anyone can report a page, post or update without logging in. Admin can suspend. */
export default async function ReportPage({ searchParams }: { searchParams: Promise<{ type?: string; id?: string }> }) {
  const { t } = await getT();
  const sp = await searchParams;
  const type = (TYPES as readonly string[]).includes(sp.type ?? "") ? sp.type! : "page";
  const id = Number(sp.id) > 0 ? String(Number(sp.id)) : "";
  return (
    <div className="container section" style={{ maxWidth: 720 }}>
      <h1>{t("report.h1")}</h1>
      <p className="muted">{t("report.intro")}</p>
      <div className="card pad">
        <PublicForm
          endpoint="/api/report"
          fields={[
            { name: "targetType", label: t("report.what"), type: "select", defaultValue: type, options: TYPES.map((x) => ({ value: x, label: t(`report.what.${x}`) })) },
            { name: "targetId", label: t("report.id"), type: "text", required: true, defaultValue: id, hint: t("report.id_hint") },
            { name: "reason", label: t("report.reason"), type: "select", required: true, defaultValue: "promotional", options: ["promotional", "false_information", "unlawful", "privacy", "impersonation", "other"].map((r) => ({ value: r, label: t(`report.reason.${r}`) })) },
            { name: "details", label: t("report.details"), type: "textarea", max: 1000 },
          ]}
          submitLabel={t("report.send")}
          sendingLabel={t("form.sending")}
          successText={t("report.sent")}
          captchaLabel={t("form.captcha")}
        />
      </div>
    </div>
  );
}
