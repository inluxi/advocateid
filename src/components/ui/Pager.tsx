import Link from "next/link";

/** Keyset pagination: "Next" carries the cursor of the last item shown. */
export function Pager({ nextHref, prevHref, page, labels }: { nextHref: string | null; prevHref?: string | null; page: number; labels: { next: string; prev: string; page: string } }) {
  if (!nextHref && !prevHref && page <= 1) return null;
  return (
    <nav className="pager" aria-label={labels.page}>
      {prevHref ? <Link href={prevHref} rel="prev nofollow">{labels.prev}</Link> : null}
      <span className="cur" aria-current="page">{page}</span>
      {nextHref ? <Link href={nextHref} rel="next nofollow">{labels.next}</Link> : null}
    </nav>
  );
}
