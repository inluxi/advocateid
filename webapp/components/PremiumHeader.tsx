/**
 * Premium-tier profiles get their own tenant-branded header (navy in our
 * fixed example brand), replacing the platform SiteHeader — matching the
 * mockup's "Premium tier" (not the CNAME/white-label tier, which we skip).
 * We have no firm-name field, so the wordmark reuses the advocate's name.
 */
export function PremiumHeader({ name }: { name: string }) {
  return (
    <header className="border-b-2 border-brand bg-brand text-white">
      <div className="mx-auto flex h-[52px] max-w-container items-center justify-between px-[18px] desktop:h-16 desktop:px-9">
        <span className="text-h3 uppercase tracking-wide">{name}</span>
        <div className="flex items-center gap-4">
          <a
            href="#contact"
            className="hidden bg-white px-4 py-2.5 text-small font-bold text-brand-ink desktop:inline-block"
          >
            Book a consultation
          </a>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            className="desktop:hidden"
            aria-hidden
          >
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </div>
      </div>
    </header>
  );
}
