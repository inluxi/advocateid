import { getT } from "@/lib/ctx";
import type { Lang } from "@/lib/i18n";
import { localName } from "@/lib/i18n";
import { LANGUAGE_OPTIONS } from "@/lib/outcomes";
import { SORT_MODES } from "@/lib/ranking";
import { searchUrl, type SearchParams } from "@/lib/url";
import { categoryNames, listCategories, listCourts, listDistrictLocalities, type Locality } from "@/repo/reference";
import { NearMeButton } from "./NearMe";

/** Filter form (GET). All filters use short codes in the query string; results pages with filters are noindex. */
export async function SearchFilters({ district, current, lang }: { district: Locality; current: SearchParams; lang: Lang }) {
  const { t } = await getT();
  const [cats, names, courts, locs] = await Promise.all([
    listCategories(),
    categoryNames(lang),
    listCourts({ districtId: district.id, limit: 100 }),
    listDistrictLocalities(district.id),
  ]);
  const nearHref = searchUrl({ ...current, n: "1", s: "nearest", after: undefined, page: undefined }, lang);
  return (
    <form method="get" action={lang === "ml" ? "/ml/search" : "/search"} className="filters pad" role="search" aria-label={t("search.filters")}>
      <input type="hidden" name="d" value={district.code} />
      {current.first ? <input type="hidden" name="first" value={current.first} /> : null}
      <div>
        <label className="lbl" htmlFor="f-q">{t("search.q")}</label>
        <input id="f-q" type="text" name="q" defaultValue={current.q ?? ""} maxLength={60} />
      </div>
      <div>
        <label className="lbl" htmlFor="f-p">{t("search.practice")}</label>
        <select id="f-p" name="p" defaultValue={current.p ?? ""}>
          <option value="">{t("search.any")}</option>
          {cats.map((c) => <option key={c.id} value={c.code}>{names.get(c.id) ?? c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="lbl" htmlFor="f-c">{t("search.court")}</label>
        <select id="f-c" name="c" defaultValue={current.c ?? ""}>
          <option value="">{t("search.any")}</option>
          {courts.map((c) => <option key={c.id} value={c.code}>{localName(lang, c.name, c.localName)}</option>)}
        </select>
      </div>
      <div>
        <label className="lbl" htmlFor="f-l">{t("search.location")}</label>
        <select id="f-l" name="l" defaultValue={current.l ?? ""}>
          <option value="">{t("search.any")}</option>
          {locs.map((l) => <option key={l.id} value={l.code}>{localName(lang, l.name, l.localName)}</option>)}
        </select>
      </div>
      <div>
        <label className="lbl" htmlFor="f-g">{t("search.language")}</label>
        <select id="f-g" name="g" defaultValue={current.g ?? ""}>
          <option value="">{t("search.any")}</option>
          {LANGUAGE_OPTIONS.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
        </select>
      </div>
      <div>
        <label className="lbl" htmlFor="f-x">{t("search.experience")}</label>
        <select id="f-x" name="x" defaultValue={current.x ?? ""}>
          <option value="">{t("search.any")}</option>
          {[3, 5, 10, 15, 20].map((n) => <option key={n} value={n}>{t("search.years_plus", { n })}</option>)}
        </select>
      </div>
      <div>
        <label className="lbl" htmlFor="f-t">{t("search.type")}</label>
        <select id="f-t" name="t" defaultValue={current.t ?? ""}>
          <option value="">{t("search.type.all")}</option>
          <option value="advocate">{t("search.type.advocate")}</option>
          <option value="firm">{t("search.type.firm")}</option>
          <option value="office">{t("search.type.office")}</option>
        </select>
      </div>
      <div>
        <label className="lbl" htmlFor="f-s">{t("search.sort")}</label>
        <select id="f-s" name="s" defaultValue={current.s ?? "relevance"}>
          {SORT_MODES.map((m) => <option key={m} value={m}>{t(m === "relevance" ? "sort.relevance.label" : `sort.${m}`)}</option>)}
        </select>
      </div>
      <button className="btn btn-block" type="submit">{t("search.apply")}</button>
      <NearMeButton href={nearHref} label={t("search.near")} note={t("search.near_note")} denied={t("search.near_denied")} />
    </form>
  );
}
