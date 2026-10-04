import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getT } from "@/lib/ctx";
import { localName } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { hasExtraParams, parseSearchParams } from "@/lib/search-params";
import { districtPracticePath } from "@/lib/url";
import { isListingIndexable } from "@/lib/indexability";
import { categoryNames, getCategoryBySlugOrCode, getLocalityByCode } from "@/repo/reference";
import { SearchPageView } from "@/components/search/SearchPageView";

type Props = { params: Promise<{ code: string; slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

async function load(code: string, slug: string) {
  const [district, category] = await Promise.all([getLocalityByCode(code), getCategoryBySlugOrCode(slug)]);
  if (!district || district.level !== "district" || !category) return null;
  return { district, category };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { lang, t } = await getT();
  const { code, slug } = await params;
  const found = await load(code, slug);
  if (!found) return { robots: { index: false } };
  const sp = parseSearchParams(await searchParams);
  const indexable = await isListingIndexable({ d: code, p: found.category.code, districtId: found.district.id, hasExtra: hasExtraParams(sp), page: Number(sp.page ?? 1) });
  const names = await categoryNames(lang);
  const dName = localName(lang, found.district.name, found.district.localName);
  const cName = names.get(found.category.id) ?? found.category.name;
  return buildMetadata({
    title: t("district.title_practice", { area: cName, district: dName }),
    description: t("district.description_practice", { area: cName, district: dName }),
    canonical: districtPracticePath(code, found.category.slug, lang),
    noindex: !indexable,
    hreflangPath: `/d/${code}/practice-area/${found.category.slug}`,
    lang,
  });
}

export default async function DistrictPracticePage({ params, searchParams }: Props) {
  const { lang } = await getT();
  const { code, slug } = await params;
  const found = await load(code, slug);
  if (!found) notFound();
  const sp = parseSearchParams(await searchParams);
  return <SearchPageView district={found.district} category={found.category} params={{ ...sp, d: undefined, p: undefined }} basePath={districtPracticePath(code, found.category.slug, lang)} lang={lang} />;
}
