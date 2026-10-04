import Link from "next/link";
import { getT } from "@/lib/ctx";
import { localName, type Lang } from "@/lib/i18n";
import { courtPath, districtPath, locationPath, locationPracticePath, withLang, type SearchParams } from "@/lib/url";
import { paramsForLinks, toFilters } from "@/lib/search-params";
import { categoryNames, getLocality, listCategories, listCourts, localityChain, type Category, type Locality } from "@/repo/reference";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SearchResults } from "./SearchResults";

export interface LoadedLocation {
  locality: Locality;
  district: Locality;
  isDistrict: boolean;
}

export async function loadLocation(id: string): Promise<LoadedLocation | null> {
  const n = Number(id);
  if (!Number.isInteger(n)) return null;
  const locality = await getLocality(n);
  if (!locality || locality.level === "state") return null;
  const chain = await localityChain(locality.id);
  const district = chain.find((c) => c.level === "district");
  if (!district) return null;
  return { locality, district, isDistrict: locality.level === "district" };
}

/** Location page and location + practice area page: advocates, firms and offices in a place. */
export async function LocationView({ loc, category, params, lang }: { loc: LoadedLocation; category?: Category | null; params: SearchParams; lang: Lang }) {
  const { t } = await getT();
  const [names, cats, f] = await Promise.all([categoryNames(lang), listCategories(), toFilters({ ...params, d: undefined })]);
  const place = localName(lang, loc.locality.name, loc.locality.localName);
  const dName = localName(lang, loc.district.name, loc.district.localName);
  const base = category ? locationPracticePath(loc.locality, category.slug, lang) : locationPath(loc.locality, lang);
  const areaName = category ? (names.get(category.id) ?? category.name) : null;
  const courts = await listCourts({ districtId: loc.district.id, limit: 100 });
  const here = courts.filter((c) => c.localityId === loc.locality.id).slice(0, 10);
  const filters = { ...f, d: loc.district.code, l: loc.isDistrict ? undefined : loc.locality.code, p: f.p ?? category?.code };
  const crumbs = [
    { name: t("crumbs.home"), href: withLang("/", lang) },
    { name: dName, href: districtPath(loc.district.code, lang) },
    ...(loc.isDistrict ? [] : [{ name: place, href: locationPath(loc.locality, lang) }]),
    ...(category ? [{ name: areaName!, href: base }] : []),
  ];
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Breadcrumbs items={crumbs} dark label={t("crumbs.label")} />
          <h1>{category ? t("location.h1_practice", { area: areaName!, place }) : t("location.h1", { place })}</h1>
          <p>
            {t("location.intro", { place, district: dName })}
            {lang === "en" && loc.locality.localName ? <><br /><span lang="ml">{loc.locality.localName}</span></> : null}
          </p>
        </div>
      </section>
      <div className="container section">
        <h2>{t("location.practice_filter")}</h2>
        <div className="chips" style={{ marginBottom: 18 }}>
          <Link className={`chip ${category ? "" : "sel"}`} href={locationPath(loc.locality, lang)}>{t("search.any")}</Link>
          {cats.map((c) => <Link key={c.id} className={`chip ${category?.id === c.id ? "sel" : ""}`} href={locationPracticePath(loc.locality, c.slug, lang)}>{names.get(c.id) ?? c.name}</Link>)}
        </div>
        <SearchResults filters={filters} cursor={params.after} page={Number(params.page ?? 1)} basePath={base} query={paramsForLinks({ ...params, d: undefined })} lang={lang} context="location" />
        {here.length ? (
          <section className="section tight">
            <h2>{t("location.courts", { place })}</h2>
            <ul className="bullets">{here.map((c) => <li key={c.id}><Link href={courtPath(c, lang)}>{localName(lang, c.name, c.localName)}</Link></li>)}</ul>
          </section>
        ) : null}
      </div>
    </>
  );
}
