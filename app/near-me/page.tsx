import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Kicker } from "@/components/Kicker";
import { GeolocateButton } from "@/components/GeolocateButton";
import { Button } from "@/components/Button";
import { siteUrl } from "@/lib/site";
import { getCategoriesWithCounts, getCitiesWithCounts, getNearbyOffices } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Advocates Near Me",
  description: "Find advocate offices closest to your current location.",
  alternates: { canonical: `${siteUrl}/near-me` },
};

export default async function NearMePage({
  searchParams,
}: {
  searchParams: Promise<{ lat?: string; lng?: string }>;
}) {
  const { lat: latParam, lng: lngParam } = await searchParams;
  const lat = latParam ? Number(latParam) : null;
  const lng = lngParam ? Number(lngParam) : null;
  const hasCoords = lat !== null && lng !== null && !Number.isNaN(lat) && !Number.isNaN(lng);

  const [categories, cities, results] = await Promise.all([
    getCategoriesWithCounts(),
    getCitiesWithCounts(),
    hasCoords ? getNearbyOffices(lat, lng) : Promise.resolve([]),
  ]);

  return (
    <>
      <SiteHeader categories={categories} cities={cities} />
      <main className="flex-1">
        <section className="border-b-2 border-ink px-[18px] py-8 desktop:px-9 desktop:py-14">
          <div className="mx-auto max-w-container">
            <Kicker>Near me</Kicker>
            <h1 className="max-w-measure text-h1 text-ink">Find advocates closest to you</h1>
            <p className="mt-3 max-w-measure text-body text-ink-800">
              Share your location to see advocate offices ranked by distance.
            </p>
            <div className="mt-6">
              <GeolocateButton />
            </div>
          </div>
        </section>

        <section className="px-[18px] py-8 desktop:px-9">
          <div className="mx-auto max-w-container">
            {!hasCoords ? (
              <p className="text-body text-ink-700">
                Use the button above to share your location, or browse by{" "}
                <Link href="/" className="underline">
                  city
                </Link>{" "}
                instead.
              </p>
            ) : results.length === 0 ? (
              <p className="text-body text-ink-700">No advocate offices found.</p>
            ) : (
              <ul className="divide-y divide-ink-300 border-t border-ink-300">
                {results.map((r) => (
                  <li key={r.officeId} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <Link href={`/${r.profileSlug}`} className="text-h3 text-ink hover:underline">
                        {r.profileName}
                      </Link>
                      <p className="text-small text-ink-800">
                        {r.officeName ? `${r.officeName} — ` : ""}
                        {r.address}
                      </p>
                      <p className="text-small text-ink-700">{r.distanceKm.toFixed(1)} km away</p>
                    </div>
                    <Button href={`/${r.profileSlug}`} variant="secondary" size="sm">
                      View profile
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
