import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/lib/ctx";
import { buildMetadata } from "@/lib/seo";
import { districtPath, withLang, practicePath } from "@/lib/url";
import { localName } from "@/lib/i18n";
import { categoryNames, listCategories, listDistricts } from "@/repo/reference";
import { latestCourtUpdates, latestPosts } from "@/repo/posts";
import { postContext } from "@/lib/post-context";
import { PostCard } from "@/components/cards/PostCards";
import { Icon } from "@/components/Icon";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, t } = await getT();
  return buildMetadata({ title: t("home.title"), description: t("home.description"), canonical: withLang("/", lang), hreflangPath: "/", lang });
}

export default async function HomePage() {
  const { lang, t } = await getT();
  const [districts, cats, names, updates, posts] = await Promise.all([listDistricts(), listCategories(), categoryNames(lang), latestCourtUpdates(4), latestPosts(4)]);
  const ctxU = await postContext(updates, lang);
  const ctxP = await postContext(posts, lang);
  const keralaFirst = districts;
  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>{t("home.h1")}</h1>
          <p className="lead">{t("home.lead")}</p>
          <form className="search-block" method="get" action={lang === "ml" ? "/ml/search" : "/search"} role="search" aria-label={t("home.search")}>
            <div>
              <label className="lbl" htmlFor="h-q">{t("home.q")}</label>
              <input id="h-q" type="text" name="q" maxLength={60} placeholder={t("home.q_ph")} />
            </div>
            <div>
              <label className="lbl" htmlFor="h-d">{t("home.district")} <span className="req" aria-hidden="true">*</span></label>
              <select id="h-d" name="d" required defaultValue="">
                <option value="" disabled>{t("home.district_ph")}</option>
                {districts.map((d) => <option key={d.id} value={d.code}>{localName(lang, d.name, d.localName)}</option>)}
              </select>
            </div>
            <button className="btn" type="submit"><Icon name="search" size="sm" />{t("home.go")}</button>
          </form>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head"><h2>{t("home.districts")}</h2></div>
          <div className="chips">
            {keralaFirst.map((d) => <Link key={d.id} className="chip" href={districtPath(d.code, lang)}>{localName(lang, d.name, d.localName)}</Link>)}
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <div className="section-head"><h2>{t("home.practice")}</h2><Link href={withLang("/practice", lang)}>{t("home.practice_all")}</Link></div>
          <div className="grid g4">
            {cats.map((c) => (
              <Link key={c.id} className="card card-area" href={practicePath(c.slug, lang)}>
                <span className="ico"><Icon name="scale" /></span>
                <span><b>{names.get(c.id) ?? c.name}</b></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {updates.length ? (
        <section className="section tight">
          <div className="container">
            <div className="section-head"><h2>{t("home.updates")}</h2></div>
            <div className="grid g2">
              {updates.map((u) => <PostCard key={u.id} post={u} author={u.pageId ? ctxU.authors.get(u.pageId) : null} courtName={u.courtId ? ctxU.courts.get(u.courtId) : null} lang={lang} t={t} />)}
            </div>
          </div>
        </section>
      ) : null}

      {posts.length ? (
        <section className="section tight">
          <div className="container">
            <div className="section-head"><h2>{t("home.posts")}</h2></div>
            <div className="grid g2">
              {posts.map((p) => <PostCard key={p.id} post={p} author={p.pageId ? ctxP.authors.get(p.pageId) : null} courtName={p.courtId ? ctxP.courts.get(p.courtId) : null} lang={lang} t={t} />)}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="container">
          <div className="signup">
            <div>
              <h2>{t("home.signup.title")}</h2>
              <p>{t("home.signup.body")}</p>
            </div>
            <Link className="btn" href="/login">{t("home.signup.cta")}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
