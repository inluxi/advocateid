import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { CtaBand, SiteFooter } from "@/components/SiteFooter";
import { SearchSelect } from "@/components/SearchSelect";
import { Kicker } from "@/components/Kicker";
import { Rule } from "@/components/Rule";
import { StatStrip } from "@/components/StatStrip";
import { TagLink } from "@/components/Badge";
import { PortraitCard } from "@/components/ProfileCard";
import { IndexList } from "@/components/IndexList";
import { JsonLd } from "@/components/JsonLd";
import { siteUrl, siteName } from "@/lib/site";
import {
  getSiteCounts,
  getCategoriesWithCounts,
  getCitiesWithCounts,
  getTopRatedProfiles,
  getCourtsWithCity,
} from "@/lib/queries";

export const metadata: Metadata = {
  title: "Find Verified Advocates in India",
  description:
    "Search advocates by city and practice area, browse courts and tribunals, and read verified reviews — all in one directory.",
  alternates: { canonical: siteUrl },
};

export default async function HomePage() {
  const [counts, categories, cities, topRated, courts] = await Promise.all([
    getSiteCounts(),
    getCategoriesWithCounts(),
    getCitiesWithCounts(),
    getTopRatedProfiles(4),
    getCourtsWithCity(5),
  ]);

  const topCity = [...cities].sort((a, b) => b.profileCount - a.profileCount)[0];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: siteName,
          url: siteUrl,
        }}
      />
      <SiteHeader categories={categories} cities={cities} compact />
      <main className="flex-1">
        <section className="border-b-2 border-ink px-[18px] py-8 desktop:px-9 desktop:py-14">
          <div className="mx-auto max-w-container">
            <Kicker>Find an advocate</Kicker>
            <h1 className="max-w-measure text-h1 text-ink">
              Find the right advocate, near you.
            </h1>
            <div className="mt-6 max-w-2xl">
              <SearchSelect
                categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
                cities={cities.map((c) => ({ slug: c.slug, name: c.name }))}
              />
            </div>
          </div>
        </section>

        <section className="px-[18px] py-6 desktop:px-9">
          <div className="mx-auto max-w-container">
            <StatStrip
              stats={[
                { label: "Advocates", value: counts.professionals },
                { label: "Cities", value: counts.cities },
                { label: "Practice areas", value: counts.categories },
                { label: "Courts & tribunals", value: counts.courts },
              ]}
            />
          </div>
        </section>

        <Rule />

        <section className="px-[18px] py-8 desktop:px-9">
          <div className="mx-auto max-w-container">
            <Kicker>Popular practice areas</Kicker>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <TagLink key={c.slug} href={topCity ? `/city/${topCity.slug}/${c.slug}` : "/"}>
                  {c.name}
                </TagLink>
              ))}
            </div>
          </div>
        </section>

        <Rule />

        <section className="px-[18px] py-8 desktop:px-9">
          <div className="mx-auto max-w-container">
            <Kicker>Top rated</Kicker>
            <h2 className="mb-4 text-h2 text-ink">Advocates our clients trust</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 desktop:grid-cols-4">
              {topRated.map((p) => (
                <PortraitCard key={p.slug} profile={p} />
              ))}
            </div>
          </div>
        </section>

        <Rule />

        <section className="px-[18px] py-8 desktop:px-9">
          <div className="mx-auto grid max-w-container grid-cols-1 gap-8 desktop:grid-cols-2">
            <div>
              <Kicker>Browse by court</Kicker>
              <IndexList
                items={courts.map((c) => ({
                  href: `/institution/${c.slug}`,
                  label: c.name,
                  meta: c.locality.name,
                }))}
              />
            </div>
            <div>
              <Kicker>Browse by city</Kicker>
              <IndexList
                items={cities.map((c) => ({
                  href: `/city/${c.slug}`,
                  label: c.name,
                  meta: `${c.profileCount} advocates`,
                }))}
              />
            </div>
          </div>
        </section>

        <CtaBand />
      </main>
      <SiteFooter />
    </>
  );
}
