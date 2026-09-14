import Link from "next/link";
import { SearchSelect } from "@/components/SearchSelect";
import type { getCategoriesWithCounts, getCitiesWithCounts } from "@/lib/queries";

export function SiteHeader({
  categories,
  cities,
  compact = false,
}: {
  categories: Awaited<ReturnType<typeof getCategoriesWithCounts>>;
  cities: Awaited<ReturnType<typeof getCitiesWithCounts>>;
  compact?: boolean;
}) {
  return (
    <header className="sticky top-0 z-10 border-b-2 border-ink bg-bg">
      <div className="mx-auto flex h-[52px] max-w-container items-center justify-between px-[18px] desktop:h-16 desktop:px-9">
        <Link href="/" className="text-h3 leading-none">
          <span className="font-extrabold text-ink">AdvocateID</span>
          <span className="font-medium text-ink-700">.in</span>
        </Link>
        <nav className="hidden items-center gap-6 desktop:flex">
          <Link href="/" className="text-small font-medium text-ink-800 hover:text-ink">
            Find an advocate
          </Link>
          <Link href="/near-me" className="text-small font-medium text-ink-800 hover:text-ink">
            Near me
          </Link>
        </nav>
        {!compact ? (
          <div className="hidden desktop:block">
            <SearchSelect
              categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
              cities={cities.map((c) => ({ slug: c.slug, name: c.name }))}
              compact
            />
          </div>
        ) : null}
      </div>
    </header>
  );
}
