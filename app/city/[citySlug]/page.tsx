import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { CtaBand, SiteFooter } from "@/components/SiteFooter";
import { Kicker } from "@/components/Kicker";
import { Rule } from "@/components/Rule";
import { StatStrip } from "@/components/StatStrip";
import { TagLink } from "@/components/Badge";
import { PortraitCard } from "@/components/ProfileCard";
import { Tag } from "@/components/Badge";
import { IndexList } from "@/components/IndexList";
import { Breadcrumb } from "@/components/Breadcrumb";
import { JsonLd } from "@/components/JsonLd";
import { siteUrl, siteName } from "@/lib/site";
import { getCategoriesWithCounts, getCitiesWithCounts, getCityPageData } from "@/lib/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ citySlug: string }>;
}): Promise<Metadata> {
  const { citySlug } = await params;
  const data = await getCityPageData(citySlug);
  if (!data) return {};
  return {
    title: `Advocates in ${data.city.name}`,
    description: `Find verified advocates in ${data.city.name} by practice area. Browse courts, localities, and top-rated advocates.`,
    alternates: { canonical: `${siteUrl}/city/${citySlug}` },
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ citySlug: string }>;
}) {
  const { citySlug } = await params;
  const [data, categories, cities] = await Promise.all([
    getCityPageData(citySlug),
    getCategoriesWithCounts(),
    getCitiesWithCounts(),
  ]);
  if (!data) notFound();

  const { city, localities, categories: cityCategories, institutions, topRated, nearbyCities, professionalCount } = data;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `Advocates in ${city.name}`,
          itemListElement: topRated.map((p, i) => ({
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
            <Breadcrumb items={[{ label: "Home", href: "/" }, { label: city.name }]} />
            <h1 className="mt-2 text-h1 text-ink">Advocates in {city.name}</h1>
            {city.localName ? <p className="mt-1 text-body-lg text-ink-700">{city.localName}</p> : null}
            <p className="mt-3 max-w-measure text-body text-ink-800">
              Browse {professionalCount} advocates practising in {city.name} across {cityCategories.length}{" "}
              practice areas, or search by locality and court below.
            </p>
          </div>
        </section>

        <section className="px-[18px] py-6 desktop:px-9">
          <div className="mx-auto max-w-container">
            <StatStrip
              stats={[
                { label: "Advocates", value: professionalCount },
                { label: "Practice areas", value: cityCategories.length },
                { label: "Courts & tribunals", value: institutions.length },
                { label: "Localities", value: localities.length },
              ]}
            />
          </div>
        </section>

        <Rule />

        <section className="px-[18px] py-8 desktop:px-9">
          <div className="mx-auto max-w-container">
            <Kicker>By practice area</Kicker>
            <div className="flex flex-wrap gap-2">
              {cityCategories.map((c) => (
                <TagLink key={c.slug} href={`/city/${city.slug}/${c.slug}`}>
                  {c.name} ({c.profileCount})
                </TagLink>
              ))}
            </div>
          </div>
        </section>

        <Rule />

        <section className="px-[18px] py-8 desktop:px-9">
          <div className="mx-auto grid max-w-container grid-cols-1 gap-8 desktop:grid-cols-2">
            <div>
              <Kicker>By court &amp; tribunal</Kicker>
              <IndexList
                items={institutions.map((i) => ({ href: `/institution/${i.slug}`, label: i.name }))}
              />
            </div>
            <div>
              <Kicker>By locality</Kicker>
              <div className="flex flex-wrap gap-2">
                {localities.map((l) => (
                  <Tag key={l.slug}>
                    {l.name}
                    {l.localName ? ` · ${l.localName}` : ""}
                  </Tag>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Rule />

        <section className="px-[18px] py-8 desktop:px-9">
          <div className="mx-auto max-w-container">
            <Kicker>Top rated in {city.name}</Kicker>
            <h2 className="mb-4 text-h2 text-ink">Advocates our clients trust</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 desktop:grid-cols-4">
              {topRated.map((p) => (
                <PortraitCard key={p.slug} profile={p} />
              ))}
            </div>
          </div>
        </section>

        <Rule />

        <section className="bg-surface px-[18px] py-8 desktop:px-9">
          <div className="mx-auto max-w-container">
            <Kicker>About practising in {city.name}</Kicker>
            <p className="max-w-measure text-body-lg text-ink-800">
              {city.name} is home to a growing community of advocates covering practice areas from
              property and family law to corporate and tax matters. Whether you need representation
              before {institutions[0]?.name ?? "the local courts"} or advice on a matter closer to
              home, the advocates listed here are based in or around {city.name} and its localities.
            </p>
          </div>
        </section>

        <Rule />

        <section className="px-[18px] py-8 desktop:px-9">
          <div className="mx-auto max-w-container">
            <Kicker>Nearby cities</Kicker>
            <IndexList items={nearbyCities.map((c) => ({ href: `/city/${c.slug}`, label: c.name }))} />
          </div>
        </section>

        <CtaBand />
      </main>
      <SiteFooter />
    </>
  );
}
