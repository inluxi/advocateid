import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { siteUrl } from "@/lib/site";

export type Crumb = { label: string; href?: string };

/** Breadcrumbs render as a kicker, not a heading — exactly one h1 per page. */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  const listItems = items.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.label,
    ...(item.href ? { item: `${siteUrl}${item.href}` } : {}),
  }));

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: listItems,
        }}
      />
      <p className="text-kicker font-semibold uppercase text-ink-700">
        {items.map((item, i) => (
          <span key={item.label}>
            {i > 0 ? " · " : ""}
            {item.href ? (
              <Link href={item.href} className="hover:underline">
                {item.label}
              </Link>
            ) : (
              item.label
            )}
          </span>
        ))}
      </p>
    </>
  );
}
