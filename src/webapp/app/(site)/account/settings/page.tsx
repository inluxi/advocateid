import type { Metadata } from "next";
import { getT } from "@/lib/ctx";
import { requireUser } from "@/lib/auth-guard";
import { maskMobile } from "@/lib/phone";
import { formatDate } from "@/lib/format";
import { getDb } from "@/db/client";
import { accountConsents } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { DeleteAccount, LogoutButton } from "@/components/account/AccountActions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("settings.title"), robots: { index: false, follow: false } };
}

export default async function SettingsPage() {
  const { lang, t } = await getT();
  const session = await requireUser("/account/settings");
  const consents = await getDb().select().from(accountConsents).where(and(eq(accountConsents.accountId, session.accountId), isNull(accountConsents.deletedAt)));
  return (
    <div className="container section" style={{ maxWidth: 760 }}>
      <h1>{t("settings.h1")}</h1>
      <section className="card pad stack">
        <h2>{t("settings.data")}</h2>
        <p>{t("settings.mobile", { mobile: maskMobile(session.mobile) })}</p>
        <p>{t("settings.correct")}</p>
        <p><a className="btn btn-outline" href="/api/account/download" download>{t("settings.download")}</a></p>
      </section>
      <section className="card pad stack" style={{ marginTop: 16 }}>
        <h2>{t("settings.consents")}</h2>
        <ul className="bullets">
          {consents.map((c) => <li key={c.id}>{t(`consent.${c.type}`)} · {formatDate(c.consentedAt, lang)}{c.withdrawnAt ? ` · ${t("settings.withdrawn")}` : ""}</li>)}
        </ul>
        <p className="inline-note">{t("settings.withdraw_note")}</p>
      </section>
      <section className="card pad stack" style={{ marginTop: 16 }}>
        <h2>{t("settings.delete_h")}</h2>
        <DeleteAccount />
      </section>
      <p style={{ marginTop: 16 }}><LogoutButton /></p>
    </div>
  );
}
