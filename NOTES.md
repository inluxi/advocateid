# Build Notes

Decisions made during the build that weren't fully specified in
`BUILD_INSTRUCTIONS.md`, recorded per its own instruction to note
assumptions and keep going rather than stopping to ask.

## Design system scope

`design/professional-directory-design-system/` documents a richer product
(3 verticals, 3 pricing tiers, white-label/custom domains, analytics
dashboards) than this phase needs. Only the `lawyer` vertical and the
`free`/`professional` `profile_type` split are in scope here.

**Correction (see `other/UI mockups color palette/`):** the two `.dc.html`
mockups the design docs call "authoritative" — `Directory Pages.dc.html`
and `Directory Profile Tiers.dc.html` — turned up after the initial build
and are the real source of truth, superseding an earlier guess based only
on `design-tokens.json`'s per-vertical accents:

- **Site-wide default brand is platform red** (`#EC3013` / dark `#DD2B0F`
  / ink-safe text `#AE1800` / light `#FFC4B8`), not the lawyer-vertical
  blue — confirmed by `Directory Pages.dc.html`, which uses platform red
  for the homepage, search results, institution pages, and city index.
  Wired as `--brand`/`--brand-dark`/`--brand-ink`/`--brand-light` in
  `app/globals.css`.
- **Profile tiers map directly to the mockup's own naming**: our `free`
  `profile_type` = the mockup's "Free tier" (ruled hero, platform red,
  competitor block, "Upgrade to Premium" upsell). Our `professional`
  `profile_type` = the mockup's "Premium tier" (masthead hero, credential
  strip, tabs, no competitors) — **not** a third "Professional" tier; the
  mockup only has Free/Premium/CNAME, and BUILD_INSTRUCTIONS.md's enum
  only has two values, so `professional` = Premium.
- Premium-tier profiles hand the whole palette to the advocate's own
  brand colour — the mockup demonstrates this with ink navy (`#16233F`).
  We have no per-tenant color storage, so every professional profile uses
  that same navy, scoped locally to the profile page's content (not the
  site nav/footer) via inline CSS custom properties in
  `app/[profileSlug]/page.tsx`. Note both `--brand` *and* `--color-brand`
  (etc.) need overriding there — Tailwind v4 bakes `--color-brand:
  var(--brand)` into a resolved hex at build time rather than keeping it
  as a live indirection, so scoping `--brand` alone doesn't cascade into
  the generated utility classes.
- The mockup's Premium tier also gives the *navigation* its own
  tenant-branded header (navy, tenant wordmark, "Book a consultation" CTA)
  distinct from the platform header — this is skipped, matching the
  explicit instruction to ignore the mockup's CNAME/white-label section:
  all pages, including Premium profiles, keep the single platform
  `SiteHeader`/`SiteFooter`.
- The "FREE LISTING" flag shown on the mockup's Free tier is not shown on
  our profile pages (explicit instruction).
- Also skipped as out of scope for a read-only Phase 0 build with no
  auth/tenant model: the Premium tier's owner-only analytics band, social
  "FOLLOW" row (no social-link fields in the schema), and career-highlights
  timeline (no such field in the schema).

## Routing / page-template mapping

- `/city/[citySlug]/[categorySlug]` uses the design system's
  **search-results.md** pattern (result-card list). The filter rail from
  that spec is omitted — there's no client-side filtering in scope for a
  read-only Phase 0 build, so the page just lists matching profiles.
- Institutions are always seeded with a **city-level** locality directly
  (not a neighborhood), so institution pages resolve their city from
  `locality.name` directly rather than `locality.parent`.
- Profiles/offices use **neighborhood-level** localities whose `parent` is
  the city — city resolution there does check `.parent`.

## Data model gaps vs. the design system

- The `profiles` table has no `email` field (per BUILD_INSTRUCTIONS.md's
  schema), so the contact bar is WhatsApp + Call only, not the design's
  3-up WhatsApp/Call/Email bar.
- Institutions have no `established`/`sanctionedStrength`/crest-image
  fields, so the institution page's facts strip and crest image from
  `institution-profile.md` are omitted rather than fabricated — the page
  shows only fields that exist in the schema (type, description, locality,
  advocates practising there, related institutions).

## Placeholder assets

No real photos were provided. Seed data uses deterministic placeholder
images from `picsum.photos/seed/{slug}/400/500` (matching the 4:5 portrait
ratio) for profile and post cover photos. `next.config.ts` allowlists
`picsum.photos` as a remote image host.

## Client-side interactivity

BUILD_INSTRUCTIONS.md says "no client-side forms," meaning no
data-mutating write paths. Two small client components exist because
they're pure navigation/read helpers, not writes:

- `SearchSelect` — city+category dropdowns that `router.push` to
  `/city/[city]/[category]` on submit.
- `GeolocateButton` — reads `navigator.geolocation` and redirects to
  `/near-me?lat=..&lng=..`.

## Repo layout

The Next.js app lives under `webapp/` (not the repo root) so the root can
hold project docs and design reference material alongside it without
mixing into the app's own file tree. Run all `npm`/`prisma` commands from
inside `webapp/`.

## `/near-me`

Implemented via `prisma.$queryRaw` running a haversine formula against
`offices` joined to `profiles` (Prisma has no native geo/distance
support). Verified against seeded coordinates.
