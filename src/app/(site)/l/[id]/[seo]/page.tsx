import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getT } from "@/lib/ctx";
import { localName } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { locationPath } from "@/lib/url";
import { seoSlug } from "@/lib/text";
import { parseSearchParams } from "@/lib/search-params";
import { isListingIndexable } from "@/lib/indexability";
import { LocationView, loadLocation } from "@/components/search/LocationView";

type Props = { params: Promise<{ id: string; seo: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { lang, t } = await getT();
  const { id } = await params;
  const loc = await loadLocation(id);
  if (!loc) return { robots: { index: false } };
  const raw = await searchParams;
  const indexable = await isListingIndexable({ d: loc.district.code, l: loc.isDistrict ? undefined : loc.locality.code, districtId: loc.district.id, hasExtra: Object.keys(raw).length > 0, page: 1 });
  const name = localName(lang, loc.locality.name, loc.locality.localName);
  return buildMetadata({
    title: t("location.title", { place: name }),
    description: t("location.description", { place: name }),
    canonical: locationPath(loc.locality, lang),
    noindex: !indexable,
    hreflangPath: `/l/${loc.locality.id}/${seoSlug(loc.locality.name)}`,
    lang,
  });
}

export default async function LocationPage({ params, searchParams }: Props) {
  const { lang } = await getT();
  const { id, seo } = await params;
  const loc = await loadLocation(id);
  if (!loc) notFound();
  if (seo !== seoSlug(loc.locality.name)) permanentRedirect(locationPath(loc.locality, lang));
  return <LocationView loc={loc} params={parseSearchParams(await searchParams)} lang={lang} />;
}
