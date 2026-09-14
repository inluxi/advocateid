export function Kicker({
  children,
  nativeLabel,
  as: Tag = "p",
}: {
  children: React.ReactNode;
  nativeLabel?: string;
  as?: "p" | "h6";
}) {
  return (
    <Tag className="mb-3.5 text-kicker font-semibold uppercase text-ink-700">
      {children}
      {nativeLabel ? (
        <span className="ml-2 text-[11px] font-medium normal-case tracking-normal text-ink-600">
          {nativeLabel}
        </span>
      ) : null}
    </Tag>
  );
}
