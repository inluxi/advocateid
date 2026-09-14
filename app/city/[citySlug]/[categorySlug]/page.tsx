import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { CtaBand, SiteFooter } from "@/components/SiteFooter";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ResultCard } from "@/components/ProfileCard";
import { JsonLd } from "@/components/JsonLd";
import { siteUrl } from "@/lib/site";
import { getCategoriesWithCounts, getCitiesWithCounts, getCityCategoryPageData } from "@/lib/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ citySlug: string; categorySlug: string }>;
}): Promise<Metadata> {
  const { citySlug, categorySlug } = await params;
  const data = await getCityCategoryPageData(citySlug, categorySlug);
  if (!data) return {};
  return {
    title: `${data.category.name} Advocates in ${data.city.name}`,
    description: `Browse verified ${data.category.name} advocates in ${data.city.name} with reviews, offices, and contact details.`,
    alternates: { canonical: `${siteUrl}/city/${citySlug}/${categorySlug}` },
  };
}

export default async function CityCategoryPage({
  params,
}: {
  params: Promise<{ citySlug: string; categorySlug: string }>;
}) {
  const { citySlug, categorySlug } = await params;
  const [data, categories, cities] = await Promise.all([
    getCityCategoryPageData(citySlug, categorySlug),
    getCategoriesWithCounts(),
    getCitiesWithCounts(),
  ]);
  if (!data) notFound();

  const { city, category, results } = data;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `${category.name} advocates in ${city.name}`,
          itemListElement: results.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${siteUrl}/${p.slug}`,
            name: p.name,
          })),
        }}
      />
      <SiteHeader categories={categories} cities={cities} />
      <main className="flex-1">
        <section className="border-b-2 border-ink px-[18px] py-6 desktop:px-9 desktop:py-10">
          <div className="mx-auto max-w-container">
            <Breadcrumb
              items={[
                { label: "Home", href: "/" },
                { label: city.name, href: `/city/${city.slug}` },
                { label: category.name },
              ]}
            />
            <h1 className="mt-2 text-h1 text-ink">
              {category.name} Advocates in {city.name}
            </h1>
            <p className="mt-3 text-body text-ink-800">
              Showing {results.length} {results.length === 1 ? "advocate" : "advocates"} practising{" "}
              {category.name.toLowerCase()} in {city.name}.
            </p>
          </div>
        </section>

        <section className="px-[18px] py-6 desktop:px-9">
          <div className="mx-auto max-w-container">
            {results.length === 0 ? (
              <p className="py-8 text-body text-ink-700">
                No advocates are currently listed for {category.name} in {city.name}. Explore other
                practice areas from the{" "}
                <Link href={`/city/${city.slug}`} className="underline">
                  {city.name} city page
                </Link>
                .
              </p>
            ) : (
              <div>
                {results.map((p) => (
                  <ResultCard key={p.slug} profile={p} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="bg-surface px-[18px] py-8 desktop:px-9">
          <div className="mx-auto max-w-container">
            <p className="max-w-measure text-body-lg text-ink-800">
              Advocates practising {category.name.toLowerCase()} in {city.name} handle matters ranging
              from routine consultations to full representation before local courts. Each profile
              lists verified contact details, office locations, and client reviews so you can compare
              advocates before reaching out.
            </p>
          </div>
        </section>

        <CtaBand />
      </main>
      <SiteFooter />
    </>
  );
}
