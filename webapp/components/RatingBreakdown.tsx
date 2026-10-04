import { StarRating } from "@/components/StarRating";

export function RatingBreakdown({ reviews }: { reviews: { rating: number }[] }) {
  const total = reviews.length;
  const average = total === 0 ? 0 : reviews.reduce((sum, r) => sum + r.rating, 0) / total;
  const counts = [5, 4, 3, 2, 1].map((star) => reviews.filter((r) => r.rating === star).length);

  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="text-display text-ink">{average.toFixed(1)}</span>
        <StarRating rating={average} />
      </div>
      <p className="mt-2 text-small text-ink-700">{total} verified client reviews</p>
      <div className="mt-4 grid gap-2">
        {[5, 4, 3, 2, 1].map((star, i) => (
          <div key={star} className="flex items-center gap-2">
            <span className="w-2.5 text-small font-medium text-ink">{star}</span>
            <span className="block h-2 flex-1 bg-ink-300">
              <span
                className="block h-2 bg-brand"
                style={{ width: total === 0 ? 0 : `${(counts[i] / total) * 100}%` }}
              />
            </span>
            <span className="w-4 text-small text-ink-700">{counts[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
