import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Portrait } from "@/components/Portrait";
import { Tag, FilledBadge } from "@/components/Badge";
import { StarRating } from "@/components/StarRating";
import { Rule, Hairline } from "@/components/Rule";
import { Kicker } from "@/components/Kicker";
import { StatStrip } from "@/components/StatStrip";
import { CaseOutcomeCard } from "@/components/CaseOutcomeCard";
import { ContactBar } from "@/components/ContactBar";
import { RowCard } from "@/components/ProfileCard";
import { JsonLd } from "@/components/JsonLd";
import { siteUrl } from "@/lib/site";
import { getCategoriesWithCounts, getCitiesWithCounts, getProfileBySlug } from "@/lib/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ profileSlug: string }>;
}): Promise<Metadata> {
  const { profileSlug } = await params;
  const profile = await getProfileBySlug(profileSlug);
  if (!profile) return {};
  const category = profile.profileCategories[0]?.category.name ?? "Advocate";
  const city = profile.primaryLocality.parent?.name ?? profile.primaryLocality.name;
  return {
    title: `${profile.name} — ${category} Advocate in ${city}`,
    description: profile.tagline ?? profile.bio.slice(0, 155),
    alternates: { canonical: `${siteUrl}/${profileSlug}` },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ profileSlug: string }>;
}) {
  const { profileSlug } = await params;
  const [profile, categories, cities] = await Promise.all([
    getProfileBySlug(profileSlug),
    getCategoriesWithCounts(),
    getCitiesWithCounts(),
  ]);
  if (!profile) notFound();

  const city = profile.primaryLocality.parent?.name ?? profile.primaryLocality.name;
  const isProfessional = profile.profileType === "professional";
  const tagLimit = isProfessional ? 10 : 5;
  const courtLimit = isProfessional ? 10 : 5;
  const primaryOffice = profile.offices[0];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Attorney",
          name: profile.name,
          description: profile.bio,
          image: profile.photoUrl,
          telephone: profile.whatsappNumber,
          areaServed: city,
          address: primaryOffice
            ? {
                "@type": "PostalAddress",
                streetAddress: primaryOffice.address,
                addressLocality: primaryOffice.locality.name,
              }
            : undefined,
          geo: primaryOffice
            ? {
                "@type": "GeoCoordinates",
                latitude: Number(primaryOffice.latitude),
                longitude: Number(primaryOffice.longitude),
              }
            : undefined,
          aggregateRating:
            profile.rating !== null
              ? {
                  "@type": "AggregateRating",
                  ratingValue: profile.rating.toFixed(1),
                  reviewCount: profile.reviewCount,
                }
              : undefined,
        }}
      />
      <SiteHeader categories={categories} cities={cities} />
      <main className="flex-1 pb-24 desktop:pb-0">
        <section className="px-[18px] pt-4 desktop:px-9 desktop:pt-6">
          <div className="mx-auto max-w-container">
            <Breadcrumb
              items={[
                { label: "Home", href: "/" },
                { label: city, href: `/city/${profile.primaryLocality.parent?.slug ?? profile.primaryLocality.slug}` },
                { label: profile.name },
              ]}
            />
          </div>
        </section>

        {isProfessional ? (
          <MastheadHero profile={profile} city={city} />
        ) : (
          <RuledHero profile={profile} city={city} />
        )}

        <section className="px-[18px] py-8 desktop:px-9">
          <div className="mx-auto grid max-w-container grid-cols-1 gap-8 desktop:grid-cols-[1fr_380px]">
            <div>
              <Kicker>Expertise</Kicker>
              <div className="mb-6 flex flex-wrap gap-2">
                {profile.profileCategories.slice(0, tagLimit).map((pc) => (
                  <Tag key={pc.categoryId}>{pc.category.name}</Tag>
                ))}
              </div>

              <Kicker>About</Kicker>
              <p className="mb-6 max-w-measure whitespace-pre-line text-body-lg text-ink-800">{profile.bio}</p>

              {profile.caseSummaries.length > 0 ? (
                <>
                  <Kicker>Case outcomes</Kicker>
                  <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {profile.caseSummaries.map((cs) => (
                      <CaseOutcomeCard
                        key={cs.id}
                        title={cs.title}
                        outcomeTag={cs.outcomeTag}
                        summary={cs.summary}
                      />
                    ))}
                  </div>
                </>
              ) : null}

              {profile.posts.length > 0 ? (
                <>
                  <Kicker>Posts</Kicker>
                  <ul className="mb-6 divide-y divide-ink-300 border-t border-ink-300">
                    {profile.posts.map((post) => (
                      <li key={post.slug} className="py-3">
                        <Link href={`/${profile.slug}/posts/${post.slug}`} className="text-h3 text-ink hover:underline">
                          {post.title}
                        </Link>
                        {post.excerpt ? <p className="mt-1 text-small text-ink-700">{post.excerpt}</p> : null}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}

              <Kicker>Reviews</Kicker>
              {profile.reviews.length === 0 ? (
                <p className="mb-6 text-body text-ink-700">No reviews yet.</p>
              ) : (
                <ul className="mb-6 divide-y divide-ink-300 border-t border-ink-300">
                  {profile.reviews.map((r) => (
                    <li key={r.id} className="py-3">
                      <div className="flex items-center justify-between">
                        <p className="text-body font-semibold text-ink">{r.reviewerName}</p>
                        <StarRating rating={r.rating} />
                      </div>
                      <p className="mt-1 text-body text-ink-800">{r.comment}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <aside>
              <Kicker>Courts of practice</Kicker>
              <ul className="mb-6 divide-y divide-ink-300 border-t border-ink-300">
                {profile.profileInstitutions.slice(0, courtLimit).map((pi) => (
                  <li key={pi.institutionId} className="py-2.5">
                    <Link href={`/institution/${pi.institution.slug}`} className="text-body text-ink hover:underline">
                      {pi.institution.name}
                    </Link>
                  </li>
                ))}
              </ul>

              <Kicker>Offices</Kicker>
              <ul className="space-y-3">
                {profile.offices.map((o) => (
                  <li key={o.id} className="border border-ink-300 bg-white p-3">
                    {o.name ? <p className="text-small font-semibold text-ink">{o.name}</p> : null}
                    <p className="text-small text-ink-800">{o.address}</p>
                    <p className="text-small text-ink-700">{o.locality.name}</p>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        {!isProfessional && profile.competitors.length > 0 ? (
          <>
            <Rule />
            <section className="px-[18px] py-8 desktop:px-9">
              <div className="mx-auto max-w-container">
                <Kicker>Other advocates nearby</Kicker>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 desktop:grid-cols-3">
                  {profile.competitors.map((c) => (
                    <RowCard key={c.slug} profile={c} />
                  ))}
                </div>
              </div>
            </section>
            <section className="border-t-2 border-ink bg-brand px-[18px] py-8 text-white desktop:px-9">
              <div className="mx-auto max-w-container">
                <p className="text-kicker font-semibold uppercase text-white/80">For advocates</p>
                <h2 className="mt-2 text-h2 text-white">Hide competitors. Own the page.</h2>
                <p className="mt-2 max-w-measure text-body-lg text-white/90">
                  Upgrade to a professional listing to remove other advocates from your profile and
                  unlock career highlights, analytics, and multiple offices.
                </p>
              </div>
            </section>
          </>
        ) : null}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-10 desktop:hidden">
        <ContactBar whatsappNumber={profile.whatsappNumber} contactHours={profile.contactHours} />
      </div>

      <SiteFooter />
    </>
  );
}

type ProfileData = NonNullable<Awaited<ReturnType<typeof getProfileBySlug>>>;

function RuledHero({ profile, city }: { profile: ProfileData; city: string }) {
  const practice = profile.profileCategories[0]?.category.name ?? "Advocate";
  return (
    <section className="px-[18px] pb-8 pt-4 desktop:px-9">
      <div className="mx-auto grid max-w-container grid-cols-1 gap-8 desktop:grid-cols-[440px_1fr] desktop:divide-x-2 desktop:divide-ink">
        <div className="desktop:pr-8">
          <div className="relative">
            <Portrait src={profile.photoUrl} alt={`${profile.name}, ${practice} advocate in ${city}`} priority />
            <span className="absolute left-0 top-0">
              <FilledBadge>Free listing</FilledBadge>
            </span>
          </div>
          <ul className="mt-4 space-y-3">
            {profile.offices.map((o) => (
              <li key={o.id} className="text-small text-ink-800">
                {o.name ? <span className="font-semibold text-ink">{o.name}: </span> : null}
                {o.address}
              </li>
            ))}
          </ul>
        </div>
        <div className="desktop:pl-8">
          <Kicker>
            {practice} · {city}
          </Kicker>
          <h1 className="text-h1 text-ink">{profile.name}</h1>
          <p className="mt-2 text-body-lg text-ink-800">{profile.tagline}</p>
          <p className="mt-2 flex items-center gap-2 text-body text-ink-800">
            {profile.rating !== null ? (
              <>
                <StarRating rating={profile.rating} />
                <span>
                  {profile.rating.toFixed(1)} ({profile.reviewCount} reviews)
                </span>
              </>
            ) : (
              <span>No reviews yet</span>
            )}
          </p>
          <div className="mt-6 hidden desktop:block desktop:max-w-sm">
            <ContactBar whatsappNumber={profile.whatsappNumber} contactHours={profile.contactHours} />
          </div>
        </div>
      </div>
    </section>
  );
}

function MastheadHero({ profile, city }: { profile: ProfileData; city: string }) {
  const practice = profile.profileCategories[0]?.category.name ?? "Advocate";
  return (
    <>
      <section className="border-t-2 border-ink bg-brand px-[18px] py-6 text-white desktop:px-9 desktop:py-10">
        <div className="mx-auto grid max-w-container grid-cols-1 gap-6 desktop:grid-cols-[420px_1fr]">
          <Portrait src={profile.photoUrl} alt={`${profile.name}, ${practice} advocate in ${city}`} priority className="bg-white" />
          <div>
            <Kicker>
              <span className="text-white/80">
                {practice} · {city}
              </span>
            </Kicker>
            <h1 className="text-display uppercase text-white">{profile.name}</h1>
            <p className="mt-3 text-body-lg text-white/90">{profile.tagline}</p>
            <p className="mt-3 flex items-center gap-2 text-body text-white">
              {profile.rating !== null ? (
                <>
                  <StarRating rating={profile.rating} onColour />
                  <span>
                    {profile.rating.toFixed(1)} ({profile.reviewCount} reviews)
                  </span>
                </>
              ) : (
                <span className="text-white/80">No reviews yet</span>
              )}
              <span className="text-white/80">· Verified</span>
            </p>
          </div>
        </div>
      </section>
      <section className="hidden px-[18px] py-4 desktop:block desktop:px-9">
        <div className="mx-auto max-w-container">
          <ContactBar whatsappNumber={profile.whatsappNumber} contactHours={profile.contactHours} />
        </div>
      </section>
      <Hairline />
      <section className="px-[18px] py-4 desktop:px-9">
        <div className="mx-auto max-w-container">
          <StatStrip
            stats={[
              { label: "Case outcomes", value: profile.caseSummaries.length },
              { label: "Client reviews", value: profile.reviewCount },
              { label: "Courts of record", value: profile.profileInstitutions.length },
              { label: "Office locations", value: profile.offices.length },
            ]}
          />
        </div>
      </section>
    </>
  );
}
