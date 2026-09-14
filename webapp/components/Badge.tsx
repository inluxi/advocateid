import Link from "next/link";

const tagClasses =
  "inline-block border border-brand bg-ink-100 px-[9px] py-[5px] text-small font-medium text-brand-ink";

/** Outline tag — expertise/practice-area chips. */
export function Tag({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`${tagClasses} ${className}`}>{children}</span>;
}

/** Same visual treatment as Tag, but clickable — for practice-area index chips. */
export function TagLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`${tagClasses} hover:bg-brand hover:text-white ${className}`}>
      {children}
    </Link>
  );
}

/** Filled badge — case outcomes, tier markers. */
export function FilledBadge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-block bg-brand px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white ${className}`}
    >
      {children}
    </span>
  );
}
