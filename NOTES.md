# Build Notes

Decisions made during the build that weren't fully specified in
`BUILD_INSTRUCTIONS.md`, recorded per its own instruction to note
assumptions and keep going rather than stopping to ask.

## Design system scope

`design/professional-directory-design-system/` documents a richer product
(3 verticals, 3 pricing tiers, white-label/custom domains, analytics
dashboards) than this phase needs. Only the `lawyer` vertical and the
`free`/`professional` `profile_type` split are in scope here, so:

- The site uses a single brand color throughout: the design system's
  **lawyer** vertical accent (`#0066CC` / `#004499` dark / `#66B3FF`
  light), wired as `--brand` / `--brand-ink` CSS custom properties in
  `app/globals.css`. There's no per-tenant color customization system.
- `free` profiles render the design system's **Basic** tier treatment
  (ruled hero, FREE LISTING flag, competitor block, upsell band, 5-tag/
  5-court caps). `professional` profiles render the **Professional** tier
  treatment (masthead hero, credential strip, no competitor block, 10-tag/
  10-court caps). There's no "Premium"/white-label tier since there's no
  billing or tenant model in this phase.
- The two `.dc.html` mockup files the design docs call "authoritative"
  aren't present in this repo — the markdown specs and `design-tokens.json`
  were the actual source of truth for this build.

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

## `/near-me`

Implemented via `prisma.$queryRaw` running a haversine formula against
`offices` joined to `profiles` (Prisma has no native geo/distance
support). Verified against seeded coordinates.
