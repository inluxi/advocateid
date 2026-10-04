import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getT } from "@/lib/ctx";
import { localName } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { parseSearchParams } from "@/lib/search-params";
import { districtPath, districtPracticePath, searchUrl } from "@/lib/url";
import { getCategoryBySlugOrCode, getLocalityByCode, listDistricts } from "@/repo/reference";
import { SearchPageView } from "@/components/search/SearchPageView";

type SP = Promise<Record<string, string | string[] | undefined>>;

/** /search is always noindex; the canonical is the readable path for the same district (and practice area). */
export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const { lang, t } = await getT();
  const p = parseSearchParams(await searchParams);
  let canonical = searchUrl({}, lang);
  if (p.d) {
    const cat = p.p ? await getCategoryBySlugOrCode(p.p) : null;
    canonical = cat ? districtPracticePath(p.d, cat.slug, lang) : districtPath(p.d, lang);
  }
  return buildMetadata({ title: t("search.title"), description: t("search.description"), canonical, noindex: true, lang });
}

export default async function SearchPage({ searchParams }: { searchParams: SP }) {
  const { lang, t } = await getT();
  const params = parseSearchParams(await searchParams);
  if (!params.d) {
    const districts = await listDistricts();
    return (
      <div className="container section">
        <h1>{t("search.choose_district")}</h1>
        <p>{t("search.choose_district_body")}</p>
        <div className="chips">
          {districts.map((d) => <Link key={d.id} className="chip" href={searchUrl({ ...params, d: d.code }, lang)}>{localName(lang, d.name, d.localName)}</Link>)}
        </div>
      </div>
    );
  }
  const district = await getLocalityByCode(params.d);
  if (!district || district.level !== "district") notFound();
  const cat = params.p ? await getCategoryBySlugOrCode(params.p) : null;
  return <SearchPageView district={district} category={cat} params={params} basePath={lang === "ml" ? "/ml/search" : "/search"} lang={lang} />;
}
