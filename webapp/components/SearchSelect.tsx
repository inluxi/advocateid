"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { ButtonEl } from "@/components/Button";

type SlugName = { slug: string; name: string };

/**
 * Navigates to /city/[city]/[category] on submit. This is routing, not a
 * data-mutating form — no write path involved — so it's in scope for the
 * read-only Phase 0 build.
 *
 * Props must be plain serializable objects (no Prisma Decimal fields) since
 * this is a Client Component receiving data from a Server Component.
 */
export function SearchSelect({
  categories,
  cities,
  compact = false,
}: {
  categories: SlugName[];
  cities: SlugName[];
  compact?: boolean;
}) {
  const router = useRouter();
  const [city, setCity] = useState(cities[0]?.slug ?? "");
  const [category, setCategory] = useState(categories[0]?.slug ?? "");
  const cityId = useId();
  const categoryId = useId();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!city || !category) return;
    router.push(`/city/${city}/${category}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className={
        compact
          ? "flex items-center gap-2"
          : "grid grid-cols-1 gap-2 desktop:grid-cols-[180px_1fr_auto] desktop:gap-0 desktop:divide-x desktop:divide-ink-300 desktop:border desktop:border-ink"
      }
    >
      <label className="sr-only" htmlFor={categoryId}>
        Practice area
      </label>
      <select
        id={categoryId}
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className={`h-11 border border-ink bg-white px-3 text-small font-medium text-ink ${compact ? "" : "desktop:border-0"}`}
      >
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor={cityId}>
        City
      </label>
      <select
        id={cityId}
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className={`h-11 border border-ink bg-white px-3 text-small font-medium text-ink ${compact ? "" : "desktop:border-0"}`}
      >
        {cities.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
      <ButtonEl type="submit" variant="primary" size="md" className={compact ? "" : "desktop:h-auto"}>
        Search
      </ButtonEl>
    </form>
  );
}
