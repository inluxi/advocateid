import Link from "next/link";
import { getT } from "@/lib/ctx";
import type { Lang } from "@/lib/i18n";
import { trackImpressions } from "@/lib/impressions";
import { getSavedIds } from "@/lib/request-context";
import type { SortMode } from "@/lib/ranking";
import { runSearch, type SearchFilters as Filters, type SearchResult } from "@/repo/search";
import { AdvocateCard } from "@/components/cards/AdvocateCard";
import { Pager } from "@/components/ui/Pager";

/** Ranked results with keyset pagination. The visitor only ever sees "Sorted by relevance" and the sort names, never a score or a plan. */
export async function SearchResults({
  filters, cursor, page, basePath, query, lang, context, result: preloaded,
}: {
  filters: Filters;
  cursor?: string | null;
  page: number;
  basePath: string;
  /** Query parameters to keep in pagination links (never includes after/page). */
  query: Record<string, string | undefined>;
  lang: Lang;
  context: string;
  result?: SearchResult;
}) {
  const { t } = await getT();
  const result = preloaded ?? (await runSearch(filters, { cursor, lang }));
  const { compare, bookmarks } = await getSavedIds();
  await trackImpressions(result.cards, context);
  const sort = (filters.sort ?? "relevance") as SortMode;
  const qs = (extra: Record<string, string>) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...query, ...extra })) if (v) sp.set(k, v);
    const s = sp.toString();
    return `${basePath}${s ? `?${s}` : ""}`;
  };
  return (
    <section aria-live="polite">
      <div className="row between" style={{ marginBottom: 12 }}>
        <p className="muted" style={{ margin: 0 }}>
          {t("search.count", { n: result.total })}{result.capped ? "+" : ""} · {sort === "relevance" ? t("sort.relevance") : t(`sort.${sort}`)}
        </p>
      </div>
      {result.cards.length === 0 ? (
        <div className="card pad">
          <h2>{t("search.none.title")}</h2>
          <p>{t("search.none.body")}</p>
          <Link className="btn btn-outline" href="/contact">{t("search.none.cta")}</Link>
        </div>
      ) : (
        <div className="stack">
          {result.cards.map((c) => (
            <AdvocateCard key={c.key} card={c} lang={lang} t={t} compare={compare} bookmarks={bookmarks} />
          ))}
        </div>
      )}
      <Pager
        page={page}
        nextHref={result.nextCursor ? qs({ after: result.nextCursor, page: String(page + 1) }) : null}
        labels={{ next: t("pager.next"), prev: t("pager.prev"), page: t("pager.label") }}
      />
    </section>
  );
}
