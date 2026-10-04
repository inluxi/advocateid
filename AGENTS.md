# AGENTS.md

AdvocateID — read-only, fully-seeded legal directory demo (Phase 0).
Full spec: `BUILD_INSTRUCTIONS.md`. Build decisions/assumptions: `NOTES.md`.

## Layout

- `webapp/` — the entire Next.js app. **All npm/prisma commands run from inside `webapp/`.**
- `design/professional-directory-design-system/` — design-system specs (markdown + `design-tokens.json`). It documents a richer product than Phase 0 (3 verticals, pricing tiers, white-label); only the `lawyer` vertical and the free/professional split are in scope.
- `other/UI mockups color palette/*.dc.html` — the **authoritative visual mockups**; they supersede `design-tokens.json` (see NOTES.md for the mapping).

## Setup & commands (from `webapp/`)

1. XAMPP MySQL running (default: root, no password; phpMyAdmin at `localhost/phpmyadmin`).
2. `cp .env.example .env`
3. `npm install`
4. `npx prisma db push` then `npx prisma generate`
5. `npx prisma db seed` — idempotent (truncates and reseeds; safe to re-run)
6. `npm run dev`

Verify with `npm run lint` (ESlint flat config). No test framework, no CI.

## Toolchain quirks

- **Prisma 7**: the datasource URL lives in `prisma.config.ts`, not `schema.prisma`, and `PrismaClient` requires the explicit `@prisma/adapter-mariadb` adapter — see `lib/db.ts`. The seed script runs via `node --experimental-strip-types prisma/seed.ts`.
- **Next.js 16.3**: breaking changes vs. typical training data — read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code. `next dev` auto-writes the rules block into `webapp/AGENTS.md`; commit it (deleting it only re-creates the diff).

## Phase 0 constraints

- **Read-only demo**: no auth, no forms, no create/edit/insert flows of any kind. Do not scaffold write paths "for later."
- Every table is soft-deleted — always spread `notDeleted` (from `@/lib/db`) into `where`; never hard-delete, never show soft-deleted rows.
- All DB access goes through `lib/queries.ts`. Pages are server components; the only `"use client"` components are `SearchSelect` and `GeolocateButton` (pure navigation helpers), plus the CSS-only `Tabs`.
- "In a city" = a profile's `primaryLocality` is the city itself or a direct child of it (`inCity()` in `lib/queries.ts`). Institutions are seeded at city-level localities; profiles at neighborhood level.
- `/near-me` uses `prisma.$queryRaw` with a haversine formula (Prisma has no native geo/distance support).

## Design rules

- Site-wide brand = platform red (`--brand` family in `app/globals.css`, `#EC3013`). Professional-tier profile pages scope ink navy (`#16233F`) via inline CSS custom properties on that page's content only.
- **Tailwind v4 gotcha**: when overriding the brand on a subtree, override **both** `--brand*` and `--color-brand*` — Tailwind v4 bakes `--color-brand: var(--brand)` into a resolved hex at build time, so scoping `--brand` alone does not cascade into the generated utility classes.
- Never hardcode a hex in a component — resolve from CSS variables only.
- Design-system bindings: radius 0 everywhere, Archivo only, flush-left headings, 2px rules divide sections / 1px hairlines divide rows, portraits 4:5, mobile-first 375 → 768 → 1200.
- A11y: `#EC3013` passes 4.5:1 only at headline scale — use `--brand-ink` for paragraph-size accent text. Never remove the `2px solid var(--brand)` focus outline.
- Placeholder photos come from `picsum.photos/seed/{slug}/400/500` (allowlisted in `next.config.ts`).

## Git

- Commit after each logical unit of work, with clear messages (per `BUILD_INSTRUCTIONS.md`).
