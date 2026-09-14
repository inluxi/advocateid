import Link from "next/link";

export function CtaBand() {
  return (
    <section className="border-t-2 border-ink bg-brand px-[18px] py-8 text-white desktop:px-9 desktop:py-12">
      <div className="mx-auto max-w-container">
        <p className="text-kicker font-semibold uppercase text-white/80">For advocates</p>
        <h2 className="mt-2 text-h2 text-white">List your practice on AdvocateID</h2>
        <p className="mt-2 max-w-measure text-body-lg text-white/90">
          Reach clients searching for advocates by city and practice area.
        </p>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t-2 border-ink bg-bg px-[18px] py-6 desktop:px-9">
      <div className="mx-auto flex max-w-container flex-col gap-2 text-small text-ink-700">
        <p>
          <span className="font-extrabold text-ink">AdvocateID</span>
          <span className="font-medium">.in</span> — a directory of advocates, courts, and tribunals across
          India.
        </p>
        <p>
          <Link href="/sitemap.xml" className="hover:underline">
            Sitemap
          </Link>
        </p>
      </div>
    </footer>
  );
}
