import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getT } from "@/lib/ctx";
import { getSession } from "@/lib/session";
import { LoginForm } from "@/components/account/LoginForm";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("login.title"), robots: { index: false, follow: false } };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { t } = await getT();
  const next = (await searchParams).next ?? "/account";
  if (await getSession()) redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/account");
  return (
    <div className="container section" style={{ maxWidth: 520 }}>
      <h1>{t("login.h1")}</h1>
      <p className="muted">{t("login.intro")}</p>
      <div className="card pad"><LoginForm next={next} /></div>
    </div>
  );
}
