import Link from "next/link";
import { getT } from "@/lib/ctx";
import { localName, type Lang } from "@/lib/i18n";
import type { SearchParams } from "@/lib/url";
import { courtPath, districtPath, districtPracticePath, locationPath, withLang } from "@/lib/url";
import { toFilters, paramsForLinks } from "@/lib/search-params";
import { categoryNames, listCategories, listCourts, listChildLocalities, type Category, type Locality } from "@/repo/reference";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SearchFilters } from "./SearchFilters";
import { SearchResults } from "./SearchResults";

/** District, district + practice area, and the generic /search page share this view. */
export async function SearchPageView({
  district, category, params, basePath, lang,
}: {
  district: Locality;
  category?: Category | null;
  params: SearchParams;
  basePath: string;
  lang: Lang;
}) {
  const { t } = await getT();
  const filters = await toFilters(params);
  const [courts, areas, cats, names] = await Promise.all([
    listCourts({ districtId: district.id, limit: 12 }),
    listChildLocalities(district.id),
    listCategories(),
    categoryNames(lang),
  ]);
  const dName = localName(lang, district.name, district.localName);
  const cName = category ? (names.get(category.id) ?? category.name) : null;
  const crumbs = [
    { name: t("crumbs.home"), href: withLang("/", lang) },
    { name: dName, href: districtPath(district.code, lang) },
    ...(category ? [{ name: cName!, href: districtPracticePath(district.code, category.slug, lang) }] : []),
  ];
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Breadcrumbs items={crumbs} dark label={t("crumbs.label")} />
          <h1>{category ? t("district.h1_practice", { area: cName!, district: dName }) : t("district.h1", { district: dName })}</h1>
          <p>{t("district.intro")}</p>
        </div>
      </section>
      <div className="container section">
        <div className="results-layout">
          <details className="filters-m card" open>
            <summary className="pad"><h2 style={{ margin: 0, fontSize: 18 }}>{t("search.filters")}</h2></summary>
            <SearchFilters district={district} current={{ ...params, d: district.code, p: params.p ?? category?.code }} lang={lang} />
          </details>
          <div>
            <SearchResults
              filters={{ ...filters, d: district.code, p: filters.p ?? category?.code }}
              cursor={params.after}
              page={Number(params.page ?? 1)}
              basePath={basePath}
              query={paramsForLinks({ ...params, d: basePath.startsWith("/search") || basePath.startsWith("/ml/search") ? district.code : undefined })}
              lang={lang}
              context="search"
            />
            <section className="section tight">
              <h2>{t("district.practice_links", { district: dName })}</h2>
              <div className="chips">
                {cats.map((c) => <Link key={c.id} className="chip" href={districtPracticePath(district.code, c.slug, lang)}>{names.get(c.id) ?? c.name}</Link>)}
              </div>
            </section>
            {courts.length ? (
              <section className="section tight">
                <h2>{t("district.courts", { district: dName })}</h2>
                <ul className="bullets">
                  {courts.map((c) => <li key={c.id}><Link href={courtPath(c, lang)}>{localName(lang, c.name, c.localName)}</Link></li>)}
                </ul>
              </section>
            ) : null}
            {areas.length ? (
              <section className="section tight">
                <h2>{t("district.areas", { district: dName })}</h2>
                <div className="chips">
                  {areas.map((a) => <Link key={a.id} className="chip" href={locationPath(a, lang)}>{localName(lang, a.name, a.localName)}</Link>)}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
