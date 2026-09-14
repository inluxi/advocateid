/** Section divider: 2px solid rule, per the design system's "2px divides sections" rule. */
export function Rule({ className = "" }: { className?: string }) {
  return <hr className={`border-0 border-t-2 border-ink ${className}`} />;
}

/** Row divider inside a section: 1px hairline, per "1px hairlines divide rows" rule. */
export function Hairline({ className = "" }: { className?: string }) {
  return <hr className={`border-0 border-t border-ink-300 ${className}`} />;
}
