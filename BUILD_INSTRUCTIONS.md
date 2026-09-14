# Professional Directory — Phase 0 MVP (Read-Only, Seeded)

## Purpose

Prove out SEO structure, pSEO templates, schema.org markup, and visual design
using a fully seeded MySQL database. **No authentication, no forms, no
create/edit/insert flows of any kind.** Every page renders from data already
in the database. Job portal/listings are explicitly excluded from this phase.

This is a display-only demo build. Write paths (signup, profile creation,
editing) are a later phase and are intentionally out of scope here — do not
scaffold them "for later," just build what renders.

---

## Environment

- **Local stack**: XAMPP running Apache/MySQL, phpMyAdmin available at
  `localhost/phpmyadmin` for inspecting/editing seed data directly.
- **App runtime**: Node.js (Next.js, App Router).
- **Database**: MySQL (via XAMPP locally). Use Prisma as the ORM/schema
  layer — schema-as-code makes the seed script and future migrations much
  easier to manage than raw SQL, and Prisma's MySQL provider is stable.
- **Repo state**: empty git folder. Initialize Next.js fresh inside it.
- Provide a `.env.example` with `DATABASE_URL` pointing at local MySQL
  (`mysql://root:@localhost:3306/directory_db` — adjust to actual XAMPP
  MySQL port/credentials, default XAMPP MySQL has no root password).

---

## Git / process instructions for the coding agent

- Commit after each logical unit of work, not in one final commit. Suggested
  checkpoints: (1) Next.js scaffold + Prisma schema, (2) seed script working
  and verified in phpMyAdmin, (3) each page type as it's completed, (4) SEO
  layer (sitemap, robots, JSON-LD) once pages exist, (5) final pass.
- Write clear commit messages describing what was added, not just "wip".
- If a decision point comes up that isn't covered in this document, make the
  most reasonable choice, note it in the commit message or a `NOTES.md`, and
  keep going rather than stopping to ask — this is a fast first pass, not a
  final build.
- Permissions for file writes/commits within this project folder are
  pre-approved; proceed without asking for confirmation on each step.

---

## Database Schema

All tables include `deleted_at DATETIME NULL` and `deleted_by VARCHAR(255)
NULL` for soft deletes. All queries in the app must filter `deleted_at IS
NULL` — never hard-delete, never show soft-deleted rows.

Schema is expected to evolve — this is a first pass, not final. Prisma makes
adjusting it straightforward as we go.

### `localities`
Self-referencing hierarchy for place lookups and "near me" search.

| Column | Type | Notes |
|---|---|---|
| id | PK | |
| name | varchar | |
| local_name | varchar, nullable | regional-language name |
| latitude | decimal(10,7) | |
| longitude | decimal(10,7) | |
| parent_id | FK → localities.id, nullable | self-reference for hierarchy |
| location_type | enum('locality','town','city','district','state') | |
| slug | varchar, unique | for URL routing |
| created_at, updated_at | | |
| deleted_at, deleted_by | | soft delete |

### `verticals`
Future-proofing the partition key even though only `lawyer` is seeded now.

| Column | Type | Notes |
|---|---|---|
| id | PK | |
| name | varchar | e.g. "Lawyer" |
| slug | varchar, unique | |

### `categories`
Practice areas, scoped to a vertical. Drives city+category pSEO pages.

| Column | Type | Notes |
|---|---|---|
| id | PK | |
| vertical_id | FK → verticals.id | |
| name | varchar | e.g. "Property Law", "Criminal Law", "Family Law", "Corporate Law", "Tax Law" |
| slug | varchar, unique | |

### `profiles`
Individual advocate profiles. No firm profile type in this phase.

| Column | Type | Notes |
|---|---|---|
| id | PK | |
| vertical_id | FK → verticals.id | hard partition key |
| profile_type | enum('free','professional') | drives free vs premium rendering |
| name | varchar | |
| slug | varchar, unique | vanity URL, e.g. `j-gupta` |
| tagline | varchar, nullable | |
| bio | text | |
| photo_url | varchar | |
| whatsapp_number | varchar | |
| contact_hours | varchar, nullable | |
| primary_locality_id | FK → localities.id | for city/locality indexing |
| created_at, updated_at | | |
| deleted_at, deleted_by | | soft delete |

### `profile_categories` (pivot)
| profile_id | FK | |
| category_id | FK | |

### `offices`
A profile can have multiple office locations. Lat/long enables "nearby" search
(haversine distance query).

| Column | Type | Notes |
|---|---|---|
| id | PK | |
| profile_id | FK → profiles.id | |
| name | varchar, nullable | e.g. "Main Office" |
| address | text | |
| locality_id | FK → localities.id | |
| latitude | decimal(10,7) | |
| longitude | decimal(10,7) | |
| is_primary | boolean | |
| deleted_at, deleted_by | | soft delete |

### `institutions`
Courts, tribunals, legal bodies — a separate profile type from advocates.

| Column | Type | Notes |
|---|---|---|
| id | PK | |
| type | enum('court','tribunal','legal_body') | |
| name | varchar | |
| slug | varchar, unique | |
| locality_id | FK → localities.id | |
| latitude | decimal(10,7) | |
| longitude | decimal(10,7) | |
| description | text, nullable | |
| deleted_at, deleted_by | | soft delete |

### `profile_institutions` (pivot)
Which courts/tribunals a profile practices at.

| profile_id | FK | |
| institution_id | FK | |

### `posts`
Advocate-submitted articles (the organic growth/content loop).

| Column | Type | Notes |
|---|---|---|
| id | PK | |
| profile_id | FK → profiles.id | |
| title | varchar | |
| slug | varchar, unique | |
| excerpt | varchar, nullable | |
| body | text | |
| cover_image_url | varchar, nullable | |
| published_at | datetime | |
| deleted_at, deleted_by | | soft delete |

### `case_summaries`
Verdict/case references — factual/informational framing per legal review
notes (not promotional wording).

| Column | Type | Notes |
|---|---|---|
| id | PK | |
| profile_id | FK → profiles.id | |
| title | varchar | |
| outcome_tag | enum('favorable','unfavorable','settled','pending') | |
| summary | text | |
| reference_link | varchar, nullable | |
| deleted_at, deleted_by | | soft delete |

### `reviews`
Seeded dummy reviews — no submission form in this phase.

| Column | Type | Notes |
|---|---|---|
| id | PK | |
| profile_id | FK → profiles.id | |
| reviewer_name | varchar | |
| rating | tinyint (1–5) | |
| comment | text | |
| created_at | | |
| deleted_at, deleted_by | | soft delete |

---

## Seed Data Requirements

- **10 profiles total**, mixed `profile_type` (some `free`, some
  `professional`) so both rendering states are visible in the demo.
- Seed **everything needed to fully demo the app**: enough localities
  (build a small real hierarchy — e.g., 1–2 states → 2–3 districts → 2–3
  cities → several localities each), enough categories (5–6 practice areas),
  a handful of institutions (courts/tribunals), each profile should have
  1–2 offices, 2–3 case summaries, 2–3 posts, and 3–5 reviews.
- If any field is ambiguous or missing from this spec, fill it with
  reasonable realistic dummy data rather than leaving it blank — the goal is
  a fully demoable app, not a minimal one.
- Use realistic Indian city/locality names and lat/long coordinates (real
  coordinates, not 0,0 placeholders) so the "nearby" search is demoable.
- Seed script should be idempotent (safe to re-run without duplicating data)
  — truncate/reset relevant tables at the start of the seed run.

---

## Pages / Routes

All pages are server-rendered from the seeded DB. No client-side forms.

| Route | Purpose |
|---|---|
| `/` | Home: search bar (city + category), list of top cities, featured profiles |
| `/city/[citySlug]` | City index: localities within, top categories, profile list |
| `/city/[citySlug]/[categorySlug]` | City + category index — primary pSEO landing page |
| `/[profileSlug]` | Profile view — renders differently based on `profile_type` (free shows competitor block, professional hides it) |
| `/institution/[institutionSlug]` | Institutional profile (court/tribunal) |
| `/[profileSlug]/posts/[postSlug]` | Individual post/article view |
| `/near-me` | Nearby search using browser geolocation + haversine query against `offices` |
| `/sitemap.xml` | Dynamically generated, includes all profiles/cities/categories/institutions/posts |
| `/robots.txt` | Standard, points to sitemap |

---

## SEO / pSEO / Schema.org Requirements

- **URL structure**: clean, slug-based, no query strings for primary content
  (`/city/kochi/property-law`, not `/search?city=kochi&cat=property-law`).
- **Canonical tags** on every page (self-referencing at this stage since
  there's only one domain).
- **JSON-LD structured data** per page type:
  - Profile pages: `Attorney` type (schema.org LocalBusiness subtype),
    including `address`, `geo`, `areaServed`, `telephone`.
  - Institution pages: `GovernmentOrganization` (closest schema.org fit for
    courts/tribunals — no exact "Court" type exists).
  - Post pages: `Article`.
  - City/category index pages: `BreadcrumbList` + `ItemList` of profiles.
- **Meta titles/descriptions**: templated per page type, not hardcoded —
  e.g. profile pages: `{name} — {category} Advocate in {city} | {site}`.
- Ensure city/category pages are crawlable and internally linked from the
  home page and from each other (city page links to its categories, category
  page links back to city) — this is the core of the pSEO strategy.

---

## Visual Design

- Reference the design JSON at `/design/*.json` if present in the repo
  (Claude Design schema) — treat it as the source of truth for colors,
  typography, and component styling if it's wired in.
- If that file isn't available/integrated yet, use clean, professional
  styling appropriate for a legal directory: trustworthy, minimal, generous
  whitespace, clear typographic hierarchy — avoid anything that reads as a
  generic SaaS template.
- **Both mobile and desktop layouts required** for every page — mobile-first
  responsive build, not desktop-only with a breakpoint bolted on.
- Free vs. professional profile views should be visually distinct enough
  that the value of upgrading is obvious just from looking at both side by
  side (e.g., competitor block visible vs. hidden, maybe a subtle premium
  badge/treatment).

---

## Explicitly Out of Scope for This Phase

- Authentication / mobile OTP login
- Profile creation, editing, or any insert/update forms
- Firm profiles (only individual advocate + institution in this phase)
- Job portal / job listings
- Custom domains, subdomains, CNAME routing
- Payments
- Review submission (reviews are seeded/display-only)

---

## Open Items to Revisit Later (not blockers for this phase)

- Whether the design JSON file gets wired in now or design proceeds on
  agent's best judgment for this pass.
- Review unlock/paywall mechanics (deferred — reviews are free-to-view in
  this phase).
- Custom domain / white-label flow for Professional tier (Phase 2+).
