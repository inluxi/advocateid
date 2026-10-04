import type { Metadata } from "next";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { slugHistory } from "@/db/schema";
import { getT } from "@/lib/ctx";
import { loadOwned } from "@/lib/manage";
import { canChangeSlug } from "@/lib/slug";
import { formatDate } from "@/lib/format";
import { config } from "@/lib/config";
import { ManageNav } from "@/components/manage/ManageNav";
import { SlugManager } from "@/components/manage/SlugManager";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("manage.nav.slug"), robots: { index: false, follow: false } };
}

export default async function ManageSlug({ params }: { params: Promise<{ pageId: string }> }) {
  const { lang, t } = await getT();
  const { page, pages } = await loadOwned((await params).pageId, "/manage");
  const gate = canChangeSlug(page.slugChangedAt);
  const history = await getDb().select().from(slugHistory).where(and(eq(slugHistory.pageId, page.id), eq(slugHistory.reason, "change"))).orderBy(desc(slugHistory.id)).limit(10);
  return (
    <div className="app-shell">
      <ManageNav page={page} pages={pages.map((p) => ({ id: p.id, name: p.name }))} active="slug" />
      <div className="stack">
        <h1>{t("manage.nav.slug")}</h1>
        <p>{t("slug.current")} <code>{config.siteOrigin}/{page.slug}</code></p>
        <p className="muted">{t("slug.rules")}</p>
        <SlugManager pageId={page.id} slug={page.slug} blockedUntil={gate.ok ? null : formatDate(gate.nextAllowed!, lang)} />
        {history.length ? <section className="card pad"><h2>{t("slug.history")}</h2><ul className="bullets">{history.map((h) => <li key={h.id}><code>{h.oldSlug}</code> → {t("slug.redirects_until", { date: formatDate(h.validTo, lang) })}</li>)}</ul></section> : null}
      </div>
    </div>
  );
}
