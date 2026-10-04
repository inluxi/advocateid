import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getT } from "@/lib/ctx";
import { localName } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { parseSearchParams } from "@/lib/search-params";
import { courtPath } from "@/lib/url";
import { seoSlug } from "@/lib/text";
import { isListingIndexable } from "@/lib/indexability";
import { getCourt, getLocality } from "@/repo/reference";
import { CourtView, type CourtTab } from "@/components/search/CourtView";

type Props = { params: Promise<{ id: string; seo: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

const TABS: CourtTab[] = ["overview", "advocates", "new", "updates"];
const tabOf = (raw: Record<string, string | string[] | undefined>): CourtTab => {
  const v = Array.isArray(raw.tab) ? raw.tab[0] : raw.tab;
  return TABS.includes(v as CourtTab) ? (v as CourtTab) : "overview";
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { lang, t } = await getT();
  const { id } = await params;
  const court = Number.isInteger(Number(id)) ? await getCourt(Number(id)) : null;
  if (!court) return { robots: { index: false } };
  const raw = await searchParams;
  const hasExtra = Object.keys(raw).length > 0; // tabs, filters, pages: noindex with a canonical to the base page
  const district = court.districtId ? await getLocality(court.districtId) : null;
  const name = localName(lang, court.name, court.localName);
  const indexable = await isListingIndexable({ c: court.code, courtId: court.id, hasExtra, page: 1 });
  return buildMetadata({
    title: t("court.title", { court: name, district: district ? localName(lang, district.name, district.localName) : "" }),
    description: t("court.description", { court: name }),
    canonical: courtPath(court, lang),
    noindex: !indexable,
    hreflangPath: `/c/${court.id}/${seoSlug(court.name)}`,
    lang,
  });
}

export default async function CourtPage({ params, searchParams }: Props) {
  const { lang } = await getT();
  const { id, seo } = await params;
  const court = Number.isInteger(Number(id)) ? await getCourt(Number(id)) : null;
  if (!court) notFound();
  // {id} decides; a wrong {seo} is redirected permanently to the right address
  if (seo !== seoSlug(court.name)) permanentRedirect(courtPath(court, lang));
  const raw = await searchParams;
  return <CourtView court={court} tab={tabOf(raw)} params={parseSearchParams(raw)} lang={lang} />;
}
