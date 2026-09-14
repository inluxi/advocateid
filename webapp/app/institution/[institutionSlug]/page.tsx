import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { CtaBand, SiteFooter } from "@/components/SiteFooter";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Kicker } from "@/components/Kicker";
import { Rule } from "@/components/Rule";
import { RowCard } from "@/components/ProfileCard";
import { IndexList } from "@/components/IndexList";
import { JsonLd } from "@/components/JsonLd";
import { siteUrl } from "@/lib/site";
import { getCategoriesWithCounts, getCitiesWithCounts, getInstitutionBySlug } from "@/lib/queries";

const typeLabels = { court: "Court", tribunal: "Tribunal", legal_body: "Legal Body" } as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ institutionSlug: string }>;
}): Promise<Metadata> {
  const { institutionSlug } = await params;
  const data = await getInstitutionBySlug(institutionSlug);
  if (!data) return {};
  const { institution } = data;
  return {
    title: institution.name,
    description:
      institution.description ??
      `${institution.name}, a ${typeLabels[institution.type]} in ${institution.locality.name}.`,
    alternates: { canonical: `${siteUrl}/institution/${institutionSlug}` },
  };
}

export default async function InstitutionPage({
  params,
}: {
  params: Promise<{ institutionSlug: string }>;
}) {
  const { institutionSlug } = await params;
  const [data, categories, cities] = await Promise.all([
    getInstitutionBySlug(institutionSlug),
    getCategoriesWithCounts(),
    getCitiesWithCounts(),
  ]);
  if (!data) notFound();

  const { institution, advocates, related } = data;
  // Institutions are always seeded with a city-level locality directly (not a neighborhood),
  // so unlike profiles/offices, no parent lookup is needed here.
  const city = institution.locality.name;

  const mattersHeard = [
    ...new Set(advocates.flatMap((a) => a.profileCategories.map((pc) => pc.category.name))),
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "GovernmentOrganization",
          name: institution.name,
          description: institution.description ?? undefined,
          address: {
            "@type": "PostalAddress",
            addressLocality: institution.locality.name,
          },
          geo: {
            "@type": "GeoCoordinates",
            latitude: Number(institution.latitude),
            longitude: Number(institution.longitude),
          },
        }}
      />
      <SiteHeader categories={categories} cities={cities} />
      <main className="flex-1">
        <section className="border-b-2 border-ink px-[18px] py-6 desktop:px-9 desktop:py-10">
          <div className="mx-auto max-w-container">
            <Breadcrumb
              items={[
                { label: "Home", href: "/" },
                { label: city, href: `/city/${institution.locality.slug}` },
                { label: institution.name },
              ]}
            />
            <Kicker>{typeLabels[institution.type]}</Kicker>
            <h1 className="text-h1 text-ink">{institution.name}</h1>
            <p className="mt-1 text-body-lg text-ink-700">{institution.locality.name}</p>
            {institution.description ? (
              <p className="mt-3 max-w-measure text-body text-ink-800">{institution.description}</p>
            ) : null}
          </div>
        </section>

        <section className="px-[18px] py-8 desktop:px-9">
          <div className="mx-auto grid max-w-container grid-cols-1 gap-8 desktop:grid-cols-[1fr_380px]">
            <div>
              {advocates.length > 0 ? (
                <>
                  <Kicker>Advocates practising here</Kicker>
                  <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 desktop:grid-cols-3">
                    {advocates.map((a) => (
                      <RowCard key={a.slug} profile={{ ...a, rating: null, reviewCount: 0 }} />
                    ))}
                  </div>
                </>
              ) : null}

              {mattersHeard.length > 0 ? (
                <>
                  <Kicker>Matters heard here</Kicker>
                  <p className="text-body text-ink-800">{mattersHeard.join(", ")}</p>
                </>
              ) : null}
            </div>

            <aside>
              <Kicker>Location</Kicker>
              <p className="mb-6 text-body text-ink-800">{institution.locality.name}</p>

              {related.length > 0 ? (
                <>
                  <Kicker>Related institutions</Kicker>
                  <IndexList items={related.map((r) => ({ href: `/institution/${r.slug}`, label: r.name }))} />
                </>
              ) : null}
            </aside>
          </div>
        </section>

        <Rule />

        <CtaBand />
      </main>
      <SiteFooter />
    </>
  );
}
