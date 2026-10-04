import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/lib/ctx";
import { buildMetadata } from "@/lib/seo";
import { practicePath, withLang } from "@/lib/url";
import { categoryNames, listCategories } from "@/repo/reference";
import { countsByCategory } from "@/repo/search";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Icon } from "@/components/Icon";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, t } = await getT();
  return buildMetadata({ title: t("practice.title"), description: t("practice.description"), canonical: withLang("/practice", lang), hreflangPath: "/practice", lang });
}

export default async function PracticeIndex() {
  const { lang, t } = await getT();
  const [cats, names, counts] = await Promise.all([listCategories(), categoryNames(lang), countsByCategory()]);
  return (
    <div className="container section">
      <Breadcrumbs label={t("crumbs.label")} items={[{ name: t("crumbs.home"), href: withLang("/", lang) }, { name: t("nav.practice"), href: withLang("/practice", lang) }]} />
      <h1>{t("practice.h1")}</h1>
      <p className="muted">{t("practice.intro")}</p>
      <div className="grid g3">
        {cats.map((c) => (
          <Link key={c.id} className="card card-area" href={practicePath(c.slug, lang)}>
            <span className="ico"><Icon name="scale" /></span>
            <span><b>{names.get(c.id) ?? c.name}</b><span className="muted small">{t("practice.count", { n: counts.get(c.code) ?? 0 })}</span></span>
          </Link>
        ))}
      </div>
    </div>
  );
}
