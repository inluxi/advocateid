# AdvocateID — Professional Directory (Phase 0 MVP)

A read-only, fully-seeded legal directory demo. See
[BUILD_INSTRUCTIONS.md](./BUILD_INSTRUCTIONS.md) for the full spec and
[NOTES.md](./NOTES.md) for build decisions made along the way.

## Setup

1. Start XAMPP's MySQL service.
2. Copy the env file and adjust credentials if needed (default XAMPP MySQL
   has no root password):
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Push the schema to your local database and generate the Prisma client:
   ```bash
   npx prisma db push
   npx prisma generate
   ```
5. Seed the database (safe to re-run — it truncates and reseeds):
   ```bash
   npx prisma db seed
   ```
6. Start the dev server:
   ```bash
   npm run dev
   ```

Inspect seeded data any time at `http://localhost/phpmyadmin`.

## Stack

Next.js (App Router) + Tailwind v4 + Prisma (MySQL, via the
`@prisma/adapter-mariadb` driver adapter — Prisma 7 requires an explicit
adapter for `PrismaClient`, see `prisma.config.ts` and `lib/db.ts`).

## Routes

| Route | Purpose |
|---|---|
| `/` | Home |
| `/city/[citySlug]` | City index |
| `/city/[citySlug]/[categorySlug]` | City + practice-area listing (primary pSEO page) |
| `/[profileSlug]` | Advocate profile (free vs professional tiers) |
| `/institution/[institutionSlug]` | Court/tribunal profile |
| `/[profileSlug]/posts/[postSlug]` | Advocate article |
| `/near-me` | Geolocation-based nearby search |
| `/sitemap.xml`, `/robots.txt` | SEO |
