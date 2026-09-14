import Link from "next/link";
import { Portrait } from "@/components/Portrait";
import { StarRating } from "@/components/StarRating";
import { Button } from "@/components/Button";

export type ProfileCardData = {
  slug: string;
  name: string;
  tagline: string | null;
  photoUrl: string;
  profileType: "free" | "professional";
  rating: number | null;
  reviewCount: number;
  primaryLocality: { name: string; parent?: { name: string } | null };
  profileCategories: { category: { name: string } }[];
};

function practiceCityLine(p: ProfileCardData) {
  const practice = p.profileCategories[0]?.category.name ?? "Advocate";
  const city = p.primaryLocality.parent?.name ?? p.primaryLocality.name;
  return `${practice} · ${city}`;
}

/** Card shape A: grid card used on homepage / city index / category landing. */
export function PortraitCard({ profile }: { profile: ProfileCardData }) {
  return (
    <Link href={`/${profile.slug}`} className="block bg-white shadow-sm">
      <Portrait src={profile.photoUrl} alt={`${profile.name}, ${practiceCityLine(profile)}`} className="border-b border-ink-300" />
      <div className="p-3.5">
        <p className="text-h3 text-ink">{profile.name}</p>
        <p className="mt-1 text-small text-ink-800">{practiceCityLine(profile)}</p>
        <RatingLine rating={profile.rating} reviewCount={profile.reviewCount} />
      </div>
    </Link>
  );
}

/** Card shape B: compact row used in mobile lists. */
export function RowCard({ profile }: { profile: ProfileCardData }) {
  return (
    <Link href={`/${profile.slug}`} className="flex items-center gap-3 bg-white p-3 shadow-sm">
      <div className="w-[68px] shrink-0">
        <Portrait src={profile.photoUrl} alt={`${profile.name}, ${practiceCityLine(profile)}`} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-h3 text-ink">{profile.name}</p>
        <p className="truncate text-small text-ink-800">{practiceCityLine(profile)}</p>
        <RatingLine rating={profile.rating} reviewCount={profile.reviewCount} />
      </div>
    </Link>
  );
}

/** Card shape C: full result row for the city+category search-results page. */
export function ResultCard({ profile }: { profile: ProfileCardData }) {
  return (
    <div className="flex flex-col gap-4 border-t border-ink-300 py-5 first:border-t-0 sm:flex-row sm:items-center sm:gap-6 sm:px-2">
      <div className="w-[132px] shrink-0">
        <Portrait src={profile.photoUrl} alt={`${profile.name}, ${practiceCityLine(profile)}`} />
      </div>
      <div className="min-w-0 flex-1">
        <Link href={`/${profile.slug}`} className="text-h3 text-ink hover:underline">
          {profile.name}
        </Link>
        <p className="mt-1 text-small text-ink-800">{practiceCityLine(profile)}</p>
        {profile.tagline ? <p className="mt-1 text-small text-ink-700">{profile.tagline}</p> : null}
        <RatingLine rating={profile.rating} reviewCount={profile.reviewCount} />
      </div>
      <div className="flex shrink-0 flex-row gap-2 sm:w-[190px] sm:flex-col">
        <Button href={`/${profile.slug}`} variant="primary" size="sm" fullWidth>
          View profile
        </Button>
      </div>
    </div>
  );
}

export function RatingLine({ rating, reviewCount }: { rating: number | null; reviewCount: number }) {
  if (rating === null) {
    return <p className="mt-1 text-small text-ink-600">No reviews yet</p>;
  }
  return (
    <p className="mt-1 flex items-center gap-1 text-small text-ink-800">
      <StarRating rating={rating} />
      <span>
        {rating.toFixed(1)} ({reviewCount})
      </span>
    </p>
  );
}
