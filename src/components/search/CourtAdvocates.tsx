import { getT } from "@/lib/ctx";
import { localName, type Lang } from "@/lib/i18n";
import { LANGUAGE_OPTIONS } from "@/lib/outcomes";
import { SORT_MODES } from "@/lib/ranking";
import { categoryNames, listCategories, listChildLocalities, type Court } from "@/repo/reference";
import type { SearchParams } from "@/lib/url";
import { toFilters, paramsForLinks } from "@/lib/search-params";
import { SearchResults } from "./SearchResults";

/** Advocates tab of a court page: filters (practice area, location, language, experience, sort) plus ranked cards. */
export async function CourtAdvocates({ court, params, basePath, lang, extraHidden = {}, practiceCode }: { court: Court; params: SearchParams; basePath: string; lang: Lang; extraHidden?: Record<string, string>; practiceCode?: string }) {
  const { t } = await getT();
  const [cats, names, locs] = await Promise.all([listCategories(), categoryNames(lang), court.districtId ? listChildLocalities(court.districtId) : Promise.resolve([])]);
  const f = await toFilters({ ...params, d: undefined });
  return (
    <>
      <form className="filter-bar" method="get" action={basePath} aria-label={t("search.filters")}>
        {Object.entries(extraHidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
        <div>
          <label className="lbl" htmlFor="cf-p">{t("search.practice")}</label>
          <select id="cf-p" name="p" defaultValue={params.p ?? practiceCode ?? ""}>
            <option value="">{t("search.any")}</option>
            {cats.map((c) => <option key={c.id} value={c.code}>{names.get(c.id) ?? c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="lbl" htmlFor="cf-l">{t("search.location")}</label>
          <select id="cf-l" name="l" defaultValue={params.l ?? ""}>
            <option value="">{t("search.any")}</option>
            {locs.map((l) => <option key={l.id} value={l.code}>{localName(lang, l.name, l.localName)}</option>)}
          </select>
        </div>
        <div>
          <label className="lbl" htmlFor="cf-g">{t("search.language")}</label>
          <select id="cf-g" name="g" defaultValue={params.g ?? ""}>
            <option value="">{t("search.any")}</option>
            {LANGUAGE_OPTIONS.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
          </select>
        </div>
        <div>
          <label className="lbl" htmlFor="cf-x">{t("search.experience")}</label>
          <select id="cf-x" name="x" defaultValue={params.x ?? ""}>
            <option value="">{t("search.any")}</option>
            {[3, 5, 10, 15, 20].map((n) => <option key={n} value={n}>{t("search.years_plus", { n })}</option>)}
          </select>
        </div>
        <div>
          <label className="lbl" htmlFor="cf-s">{t("search.sort")}</label>
          <select id="cf-s" name="s" defaultValue={params.s ?? "relevance"}>
            {SORT_MODES.filter((m) => m !== "nearest").map((m) => <option key={m} value={m}>{t(m === "relevance" ? "sort.relevance.label" : `sort.${m}`)}</option>)}
          </select>
        </div>
        <div style={{ alignSelf: "end" }}><button className="btn" type="submit">{t("search.apply")}</button></div>
      </form>
      <SearchResults
        filters={{ ...f, d: undefined, c: court.code, p: f.p ?? practiceCode, t: undefined }}
        cursor={params.after}
        page={Number(params.page ?? 1)}
        basePath={basePath}
        query={{ ...extraHidden, ...paramsForLinks({ ...params, d: undefined }) }}
        lang={lang}
        context="court"
      />
    </>
  );
}
