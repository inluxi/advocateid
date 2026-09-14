/** Star rating uses the active brand color, not amber, per the design system's binding rule. */
export function StarRating({
  rating,
  onColour = false,
}: {
  rating: number;
  /** Set true when rendering on a brand-colored field (e.g. the masthead hero) so stars stay visible. */
  onColour?: boolean;
}) {
  const full = Math.round(rating);
  return (
    <span aria-hidden className={onColour ? "text-white" : "text-brand"}>
      {"★".repeat(full)}
      {"☆".repeat(Math.max(0, 5 - full))}
    </span>
  );
}
