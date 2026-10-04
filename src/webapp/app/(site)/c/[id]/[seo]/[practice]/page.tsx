import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getT } from "@/lib/ctx";
import { localName } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { parseSearchParams } from "@/lib/search-params";
import { courtPracticePath } from "@/lib/url";
import { seoSlug } from "@/lib/text";
import { isListingIndexable } from "@/lib/indexability";
import { categoryNames, getCategoryBySlugOrCode, getCourt } from "@/repo/reference";
import { CourtView } from "@/components/search/CourtView";

type Props = { params: Promise<{ id: string; seo: string; practice: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { lang, t } = await getT();
  const { id, practice } = await params;
  const [court, cat] = await Promise.all([Number.isInteger(Number(id)) ? getCourt(Number(id)) : null, getCategoryBySlugOrCode(practice)]);
  if (!court || !cat) return { robots: { index: false } };
  const raw = await searchParams;
  const indexable = await isListingIndexable({ c: court.code, p: cat.code, courtId: court.id, hasExtra: Object.keys(raw).length > 0, page: 1 });
  const names = await categoryNames(lang);
  const cName = names.get(cat.id) ?? cat.name;
  const name = localName(lang, court.name, court.localName);
  return buildMetadata({
    title: t("court.title_practice", { area: cName, court: name }),
    description: t("court.description_practice", { area: cName, court: name }),
    canonical: courtPracticePath(court, cat.slug, lang),
    noindex: !indexable,
    hreflangPath: `/c/${court.id}/${seoSlug(court.name)}/${cat.slug}`,
    lang,
  });
}

export default async function CourtPracticePage({ params, searchParams }: Props) {
  const { lang } = await getT();
  const { id, seo, practice } = await params;
  const [court, cat] = await Promise.all([Number.isInteger(Number(id)) ? getCourt(Number(id)) : null, getCategoryBySlugOrCode(practice)]);
  if (!court || !cat) notFound();
  if (seo !== seoSlug(court.name)) permanentRedirect(courtPracticePath(court, cat.slug, lang));
  return <CourtView court={court} tab="advocates" params={parseSearchParams(await searchParams)} lang={lang} practice={cat} />;
}
