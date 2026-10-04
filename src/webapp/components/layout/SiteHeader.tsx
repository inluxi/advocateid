import Link from "next/link";
import { getCurrentPath, getT } from "@/lib/ctx";
import { getSession } from "@/lib/session";
import { Icon } from "@/components/Icon";
import { withLang } from "@/lib/url";

/** Path with the language prefix switched. The language is never chosen automatically. */
function switchLang(path: string, lang: "en" | "ml"): string {
  const bare = path.replace(/^\/ml(?=\/|$|\?)/, "") || "/";
  return lang === "ml" ? `/ml${bare === "/" ? "" : bare}` : bare;
}

export async function SiteHeader() {
  const { lang, t } = await getT();
  const session = await getSession();
  const path = await getCurrentPath();
  const other = lang === "en" ? "ml" : "en";
  const links = [
    { href: withLang("/", lang), label: t("nav.home") },
    { href: withLang("/search", lang), label: t("nav.search") },
    { href: withLang("/practice", lang), label: t("nav.practice") },
    { href: withLang("/pricing", lang), label: t("nav.pricing") },
    { href: withLang("/about", lang), label: t("nav.about") },
  ];
  return (
    <header className="site-header">
      <div className="container">
        <Link className="brand" href={withLang("/", lang)}>
          <span>
            AdvocateID
            <small>{t("brand.tagline")}</small>
          </span>
        </Link>
        <nav className="nav" aria-label={t("nav.main")}>
          {links.map((l) => (
            <Link key={l.href} href={l.href}>{l.label}</Link>
          ))}
        </nav>
        <div className="hdr-actions">
          <a className="lang-pill" href={switchLang(path, other)} hrefLang={other} lang={other}>
            {other === "ml" ? "മലയാളം" : "English"}
          </a>
          {session ? (
            <Link className="btn btn-brass btn-sm" href="/account"><Icon name="user" size="sm" />{t("nav.account")}</Link>
          ) : (
            <Link className="btn btn-brass btn-sm" href="/login">{t("nav.login")}</Link>
          )}
          <details className="mobile-menu">
            <summary className="icon-btn" aria-label={t("nav.menu")}><Icon name="menu" /></summary>
            <div className="mobile-nav">
              {links.map((l) => (
                <Link key={l.href} href={l.href}>{l.label}</Link>
              ))}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
