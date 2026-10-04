import Link from "next/link";
import { JsonLd } from "./JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

export interface Crumb {
  name: string;
  href: string;
}

/** Visible trail plus BreadcrumbList markup (all pages except home). */
export function Breadcrumbs({ items, dark = false, label }: { items: Crumb[]; dark?: boolean; label: string }) {
  return (
    <>
      <nav className={`crumbs ${dark ? "" : "dark"}`} aria-label={label}>
        {items.map((c, i) => (
          <span key={c.href}>
            {i < items.length - 1 ? <Link href={c.href}>{c.name}</Link> : <span aria-current="page">{c.name}</span>}
            {i < items.length - 1 ? " /" : ""}
          </span>
        ))}
      </nav>
      <JsonLd data={breadcrumbJsonLd(items.map((c) => ({ name: c.name, url: c.href })))} />
    </>
  );
}
