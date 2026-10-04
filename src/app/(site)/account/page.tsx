import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/lib/ctx";
import { requireUser } from "@/lib/auth-guard";
import { maskMobile } from "@/lib/phone";
import { MAX_PAGES_PER_ACCOUNT } from "@/lib/entitlements";
import { profilePath } from "@/lib/url";
import { listAccountPages } from "@/repo/pages";
import { pendingFor } from "@/repo/memberships";
import { listBookmarkIds } from "@/repo/bookmarks";
import { ActingSwitcher, LogoutButton, MembershipActions } from "@/components/account/AccountActions";
import { Avatar } from "@/components/ui/Avatar";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("account.title"), robots: { index: false, follow: false } };
}

export default async function AccountPage() {
  const { lang, t } = await getT();
  const session = await requireUser("/account");
  const pages = await listAccountPages(session.accountId);
  const [pending, bookmarks] = await Promise.all([pendingFor(pages.map((p) => p.id)), listBookmarkIds(session.accountId)]);
  return (
    <div className="container section">
      <div className="row between">
        <div>
          <h1>{t("account.h1")}</h1>
          <p className="muted">{t("account.signed_in", { mobile: maskMobile(session.mobile) })}</p>
        </div>
        <LogoutButton />
      </div>
      <ActingSwitcher pages={pages.map((p) => ({ id: p.id, name: p.name }))} current={session.actingPageId} />

      <section className="section tight">
        <div className="section-head">
          <h2>{t("account.pages")}</h2>
          {pages.length < MAX_PAGES_PER_ACCOUNT ? <Link className="btn btn-sm" href="/manage/new">{t("account.create")}</Link> : <span className="muted small">{t("account.max_pages", { n: MAX_PAGES_PER_ACCOUNT })}</span>}
        </div>
        {pages.length === 0 ? <div className="card pad"><p>{t("account.no_pages")}</p><Link className="btn" href="/manage/new">{t("account.create")}</Link></div> : (
          <div className="grid g2">
            {pages.map((p) => (
              <article key={p.id} className="card pad stack">
                <div className="row">
                  <Avatar name={p.name} photoKey={p.photoKey} size="s" />
                  <div>
                    <h3 style={{ margin: 0 }}>{p.name}</h3>
                    <div className="muted small">{t(p.type === "firm" ? "card.firm" : "profile.advocate")} · {t(`plan.${p.plan}`)} · <span className={`pill ${p.status === "active" ? "ok" : "bad"}`}>{t(`status.${p.status}`)}</span></div>
                  </div>
                </div>
                {/* Completeness is shown to the owner only */}
                <div>
                  <div className="limit"><span>{t("account.completeness")}</span><span>{p.completeness}%</span></div>
                  <div className="meter" role="progressbar" aria-valuenow={p.completeness} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${p.completeness}%` }} /></div>
                </div>
                <div className="row">
                  <Link className="btn btn-sm" href={`/manage/${p.id}`}>{t("account.edit")}</Link>
                  <Link className="btn btn-sm btn-outline" href={profilePath(p.slug, lang)}>{t("account.view")}</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {pending.requests.length + pending.invites.length > 0 ? (
        <section className="section tight">
          <h2>{t("account.pending")}</h2>
          <div className="stack">
            {pending.requests.map((r) => <div key={r.id} className="card pad row between"><span>{t("account.request_text", { advocate: r.advocateName, firm: r.firmName, title: r.title ?? "" })}</span><MembershipActions id={r.id} kind="request" /></div>)}
            {pending.invites.map((r) => <div key={r.id} className="card pad row between"><span>{t("account.invite_text", { firm: r.firmName, advocate: r.advocateName, title: r.title ?? "" })}</span><MembershipActions id={r.id} kind="invite" /></div>)}
          </div>
        </section>
      ) : null}

      <section className="section tight">
        <div className="row">
          <Link className="btn btn-outline" href="/account/bookmarks">{t("account.bookmarks", { n: bookmarks.length })}</Link>
          <Link className="btn btn-outline" href="/account/settings">{t("account.settings")}</Link>
        </div>
      </section>
    </div>
  );
}
