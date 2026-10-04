import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getT } from "@/lib/ctx";
import { localName } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { locationPracticePath } from "@/lib/url";
import { seoSlug } from "@/lib/text";
import { parseSearchParams } from "@/lib/search-params";
import { isListingIndexable } from "@/lib/indexability";
import { categoryNames, getCategoryBySlugOrCode } from "@/repo/reference";
import { LocationView, loadLocation } from "@/components/search/LocationView";

type Props = { params: Promise<{ id: string; seo: string; practice: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { lang, t } = await getT();
  const { id, practice } = await params;
  const [loc, cat] = await Promise.all([loadLocation(id), getCategoryBySlugOrCode(practice)]);
  if (!loc || !cat) return { robots: { index: false } };
  const raw = await searchParams;
  const indexable = await isListingIndexable({ d: loc.district.code, l: loc.isDistrict ? undefined : loc.locality.code, p: cat.code, districtId: loc.district.id, hasExtra: Object.keys(raw).length > 0, page: 1 });
  const names = await categoryNames(lang);
  const place = localName(lang, loc.locality.name, loc.locality.localName);
  const area = names.get(cat.id) ?? cat.name;
  return buildMetadata({
    title: t("location.title_practice", { area, place }),
    description: t("location.description_practice", { area, place }),
    canonical: locationPracticePath(loc.locality, cat.slug, lang),
    noindex: !indexable,
    hreflangPath: `/l/${loc.locality.id}/${seoSlug(loc.locality.name)}/${cat.slug}`,
    lang,
  });
}

export default async function LocationPracticePage({ params, searchParams }: Props) {
  const { lang } = await getT();
  const { id, seo, practice } = await params;
  const [loc, cat] = await Promise.all([loadLocation(id), getCategoryBySlugOrCode(practice)]);
  if (!loc || !cat) notFound();
  if (seo !== seoSlug(loc.locality.name)) permanentRedirect(locationPracticePath(loc.locality, cat.slug, lang));
  return <LocationView loc={loc} category={cat} params={parseSearchParams(await searchParams)} lang={lang} />;
}
