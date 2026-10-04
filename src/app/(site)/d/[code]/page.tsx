import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getT } from "@/lib/ctx";
import { localName } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { hasExtraParams, parseSearchParams } from "@/lib/search-params";
import { districtPath } from "@/lib/url";
import { isListingIndexable } from "@/lib/indexability";
import { getLocalityByCode } from "@/repo/reference";
import { SearchPageView } from "@/components/search/SearchPageView";

type Props = { params: Promise<{ code: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { lang, t } = await getT();
  const { code } = await params;
  const district = await getLocalityByCode(code);
  if (!district || district.level !== "district") return { robots: { index: false } };
  const sp = parseSearchParams(await searchParams);
  const extra = hasExtraParams(sp);
  const indexable = await isListingIndexable({ d: code, districtId: district.id, hasExtra: extra, page: Number(sp.page ?? 1) });
  const name = localName(lang, district.name, district.localName);
  return buildMetadata({
    title: t("district.title", { district: name }),
    description: t("district.description", { district: name }),
    canonical: districtPath(code, lang),
    noindex: !indexable,
    hreflangPath: `/d/${code}`,
    lang,
  });
}

export default async function DistrictPage({ params, searchParams }: Props) {
  const { lang } = await getT();
  const { code } = await params;
  const district = await getLocalityByCode(code);
  if (!district || district.level !== "district") notFound();
  const sp = parseSearchParams(await searchParams);
  return <SearchPageView district={district} params={{ ...sp, d: undefined }} basePath={districtPath(code, lang)} lang={lang} />;
}
