import Link from "next/link";

export function IndexList({
  items,
}: {
  items: { href: string; label: string; meta?: string }[];
}) {
  return (
    <ul className="divide-y divide-ink-300 border-t border-ink-300">
      {items.map((item) => (
        <li key={item.href}>
          <Link href={item.href} className="flex items-center justify-between py-3 text-body hover:underline">
            <span className="text-ink">{item.label}</span>
            {item.meta ? <span className="text-small text-ink-700">{item.meta}</span> : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
