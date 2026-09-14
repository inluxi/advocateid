/** Star rating uses the active brand color, not amber, per the design system's binding rule. */
export function StarRating({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span aria-hidden className="text-brand">
      {"★".repeat(full)}
      {"☆".repeat(Math.max(0, 5 - full))}
    </span>
  );
}
