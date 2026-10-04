import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/lib/ctx";
import { requireUser } from "@/lib/auth-guard";
import { getPagesByIds } from "@/repo/pages";
import { listBookmarkIds } from "@/repo/bookmarks";
import { hydrateCards } from "@/repo/search";
import { AdvocateCard } from "@/components/cards/AdvocateCard";
import { getSavedIds } from "@/lib/request-context";
import type { Ranked } from "@/lib/ranking";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("bookmarks.title"), robots: { index: false, follow: false } };
}

export default async function BookmarksPage() {
  const { lang, t } = await getT();
  const session = await requireUser("/account/bookmarks");
  const ids = await listBookmarkIds(session.accountId);
  const pages = (await getPagesByIds(ids)).filter((p) => p.status === "active");
  const ranked: Ranked[] = ids
    .map((id) => pages.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map((p, i) => ({
      c: { id: -(i + 1), pageId: p.id, officeId: null, type: "page" as const, kind: p.type as "advocate" | "firm", name: p.name, districtCode: "", localityCodes: ",", categoryCodes: ",", courtCodes: ",", languageCodes: ",", years: 0, lat: null, lng: null, score: 0, searchText: "", createdPage: p.createdAt },
      total: 0,
      distanceKm: null,
    }));
  const cards = await hydrateCards(ranked, lang);
  const { compare, bookmarks } = await getSavedIds();
  return (
    <div className="container section">
      <h1>{t("bookmarks.h1")}</h1>
      {cards.length === 0 ? <p className="muted">{t("bookmarks.empty")} <Link href="/search">{t("nav.search")}</Link></p> : (
        <div className="stack">{cards.map((c) => <AdvocateCard key={c.key} card={c} lang={lang} t={t} compare={compare} bookmarks={bookmarks} />)}</div>
      )}
    </div>
  );
}
