# 🚀 advocateid.in MVP1 - Claude Code Instructions

**Status:** Ready to code. You have AGENTS.md + PROJECT_REQUIREMENTS_v6.md + design files.
**Budget:** $50 Claude Code Cloud credits
**Timeline:** Code while sleeping, wake up to tested PR

---

## 🎯 ONE CRITICAL DECISION FIRST

**Tier Structure (FINAL):**
- **Basic:** Free, no banner, no highlights, no links, 5 courts/practices/career, 2 case summaries, 1 office
- **Professional:** ₹599/mo, banner, highlights, links, 10 courts/practices/career, 10 case summaries, 5 offices
- **Premium:** ₹999/mo, **ONLY DIFFERENCE:** gets `{slug}.p.advocateid.in` subdomain (custom domain binding paused)

**Search Results:** All three tiers listed on advocateid.in. Premium shows subdomain URL internally (for admin), but PUBLIC results don't show subdomain yet.

**Admin Dashboard:** /admin (same app, not admin.advocateid.in)

Use and follow ./design folder for design and style

---

## 📄 THIS FILE CONTAINS ALL CONTEXT

Read this completely before starting Phase 1.

---

# PART 1: COMPLIANCE & RULES

## DPDP Act 2023 + AGENTS.md Rules (READ FIRST)

### Personal Data Definition
Mobile numbers, OTP logs, names, enrolment numbers, addresses, IP addresses, device IDs, visitor IDs are **personal data**.

### Non-Negotiable Rules
1. **Notice & Consent:** Tell users before collecting data. Pre-ticked boxes = NO.
2. **Purpose Limit:** Collect only what feature needs. No data reuse without new consent.
3. **Minimization:** Don't store full IPs in analytics. Use rotating random visitor ID.
4. **Retention:** Every table with personal data has purge job.
   - OTP records: purged within days (expire within minutes)
   - Deleted pages: soft deleted, purged after 30 days
   - Reserved slugs: reserved 90 days after deletion
5. **Security:** Encrypt OTP hash. Rate limit OTP endpoints. Never log personal data.
6. **Breach:** Report to founder immediately if suspected.
7. **Rights:** Product must support `/account/download`, `/account/delete`, `/grievance`.

### Bar Council Rule 36 (Advocates Act)
**BANNED PHRASES (hardcode these in validator):**
```
"best", "top", "leading", "#1", "number one", "famous", "expert in",
"guaranteed", "winning", "won", "cheap", "discount", "hire", "book now",
"100% success", "testimonial", "star rating", "5 star", "before/after",
"price", "fee", "cost", "best rate"
```

**ALLOWED:**
- Fact-based: "Represented petitioner. Family Court, Ernakulam, 2023. Outcome: allowed."
- Platform is "technology directory, not law firm, not referral service"
- No ratings, no reviews, no verified seal until counsel clears (MVP2+)

### Wording for UI
- Action: **Connect** (opens WhatsApp) — NOT "Hire", "Book", "Contact"
- Message to advocate: "Hello, I found your page {address}. I would like to speak with you."

---

# PART 2: STACK & SETUP

## Technology Stack
```
Frontend:    Next.js 15+ (App Router) + TypeScript + Tailwind CSS
Backend:     Cloudflare Workers (wrangler deploy)
Database:    D1 (SQLite now, Postgres-portable schema for later)
ORM:         Drizzle ORM (prevents raw SQL)
Images:      R2 (no egress fees)
Auth:        OTP via Twilio (or Indian SMS provider)
Cache:       Cloudflare KV (for sessions, bookmarks)
DNS:         Cloudflare (free tier)
Hosting:     Vercel OR Cloudflare Pages (free tier)
Deploy:      Git branches: main (prod) → staging (preview) auto-deploy
Tests:       Jest (unit) + Playwright (e2e later)
Lint:        ESLint + Prettier
CI/CD:       GitHub Actions (on every PR)
Monitoring:  Sentry + Cloudflare Logs
```

## Repo Structure (EXACT)
```
advocateid/
├─ .github/workflows/
│  └─ ci.yml                    (runs on every PR: lint, test, build)
├─ src/
│  ├─ db/
│  │  ├─ schema.ts              (Drizzle schema — ALL tables)
│  │  ├─ migrations/            (auto-generated)
│  │  ├─ queries.ts             (safe queries, typed)
│  │  └─ seed.ts                (dev data: 5 fake advocates)
│  ├─ app/                       (Next.js App Router)
│  │  ├─ layout.tsx             (root layout, design system)
│  │  ├─ page.tsx               (home page)
│  │  ├─ (public)/
│  │  │  ├─ [slug]/page.tsx      (/{slug} — advocate/firm profile)
│  │  │  ├─ c/[id]/page.tsx      (/c/{id}/{court-seo})
│  │  │  ├─ search/page.tsx      (/search?...)
│  │  │  ├─ post/[id]/page.tsx   (/post/{id}/{seo})
│  │  │  └─ ...
│  │  ├─ (auth)/
│  │  │  ├─ login/page.tsx       (/login)
│  │  │  └─ verify/page.tsx      (/verify OTP)
│  │  ├─ account/
│  │  │  ├─ page.tsx             (/account — dashboard)
│  │  │  ├─ bookmarks/page.tsx   (/account/bookmarks)
│  │  │  └─ settings/page.tsx    (/account/settings)
│  │  ├─ manage/
│  │  │  ├─ new/page.tsx         (/manage/new — create page)
│  │  │  ├─ [pageId]/page.tsx    (/manage/{pageId} — editor)
│  │  │  └─ ...
│  │  ├─ admin/
│  │  │  ├─ layout.tsx           (admin auth check)
│  │  │  ├─ page.tsx             (/admin dashboard)
│  │  │  ├─ courts/page.tsx
│  │  │  ├─ reports/page.tsx
│  │  │  └─ ...
│  │  └─ api/
│  │     ├─ auth/
│  │     │  ├─ send-otp/route.ts       (POST, rate limited)
│  │     │  └─ verify-otp/route.ts     (POST)
│  │     ├─ pages/
│  │     │  ├─ route.ts                (CRUD)
│  │     │  └─ [id]/route.ts           (GET, PATCH, DELETE)
│  │     ├─ search/route.ts            (GET with filters)
│  │     ├─ admin/
│  │     │  ├─ courts/import/route.ts  (CSV upload)
│  │     │  ├─ courts/[id]/route.ts
│  │     │  ├─ pages/[id]/suspend/route.ts
│  │     │  └─ ...
│  │     └─ health/route.ts            (health check)
│  ├─ components/                (from your design HTML)
│  │  ├─ Button.tsx
│  │  ├─ Card.tsx
│  │  ├─ Form.tsx
│  │  ├─ ProfileHeader.tsx
│  │  ├─ SearchFilters.tsx
│  │  └─ ...
│  ├─ lib/
│  │  ├─ auth.ts                (OTP helpers, session mgmt)
│  │  ├─ db.ts                  (Drizzle instance)
│  │  ├─ search.ts              (keyset pagination, bounding box)
│  │  ├─ translate.ts           (i18n)
│  │  ├─ validate.ts            (banned word checker, sanitize)
│  │  ├─ types.ts               (shared TS types)
│  │  └─ constants.ts           (codes, banned phrases, retention days)
│  ├─ middleware.ts              (auth, admin checks)
│  └─ styles/
│     └─ globals.css             (Tailwind + design tokens)
├─ public/
│  ├─ locales/
│  │  ├─ en.json                 (English UI text)
│  │  └─ ml.json                 (Malayalam — later)
│  └─ icons/
├─ tests/
│  ├─ unit/
│  │  ├─ schema.test.ts          (Drizzle schema validation)
│  │  ├─ auth.test.ts            (OTP flow)
│  │  ├─ validate.test.ts        (banned words)
│  │  ├─ search.test.ts          (ranking logic)
│  │  └─ ...
│  └─ fixtures/
│     └─ seed-data.ts            (test data)
├─ docs/
│  ├─ AGENTS.md                  (compliance rules)
│  ├─ PROJECT_REQUIREMENTS_v6.md  (feature spec)
│  ├─ SCHEMA.md                  (data model explained)
│  ├─ API.md                     (endpoint docs, auto-updated)
│  └─ TESTING.md                 (this file explains tests)
├─ .env.local.example             (template, don't commit)
├─ .env.staging.example           (template for staging)
├─ .env.production.example        (template for prod)
├─ wrangler.toml                  (Cloudflare config)
├─ wrangler.json                  (generated by wrangler)
├─ drizzle.config.ts              (ORM config)
├─ next.config.js                 (Next.js config)
├─ tailwind.config.js             (Tailwind config)
├─ tsconfig.json                  (TypeScript config)
├─ jest.config.js                 (test config)
├─ .gitignore                      (.env.local, .wrangler/, node_modules)
├─ package.json
├─ package-lock.json
└─ README.md
```

---

# PART 3: DATA MODEL (Drizzle Schema)

## Core Tables

### accounts
```ts
accounts {
  id: string (PK, uuid)
  mobile: string (unique, E.164 format)
  status: 'active' | 'suspended'
  created_at: timestamp
  updated_at: timestamp
}
```

### pages
```ts
pages {
  id: string (PK, uuid)
  account_id: string (FK accounts.id)
  type: 'advocate' | 'firm'
  slug: string (unique, 5-30 chars, a-z0-9-, immutable)
  name: string (max 100)
  district_id: string (FK localities.id)
  plan: 'basic' | 'professional' | 'premium'
  photo_key: string (R2 key, nullable)
  banner_key: string (R2 key, nullable, only prof/premium)
  bio: string (max 500)
  about: string (max 5000)
  language: 'en' | 'ml' (default 'en')
  completeness: integer (0-100, owner-only)
  status: 'active' | 'suspended' | 'deleted'
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp (nullable)
  deleted_by: string (nullable, admin id)
  
  Indexes: (account_id), (slug), (district_id), (status)
}
```

### page_advocate
```ts
page_advocate {
  page_id: string (FK pages.id, PK)
  enrolment_no: string (unique per state, mandatory)
  year_enrolled: integer
  
  Constraint: page_id.type = 'advocate'
}
```

### page_firm
```ts
page_firm {
  page_id: string (FK pages.id, PK)
  established_year: integer (nullable)
  
  Constraint: page_id.type = 'firm'
}
```

### localities
```ts
localities {
  id: string (PK, uuid)
  parent_id: string (nullable, FK localities.id)
  level: 'state' | 'district' | 'city' | 'locality'
  code: string (2-6 lowercase chars, unique per level)
  name: string (max 100)
  local_name: string (max 100, Malayalam)
  lat: decimal (nullable)
  lng: decimal (nullable)
  
  Indexes: (parent_id), (code), (lat, lng)
}
```

### courts
```ts
courts {
  id: string (PK, uuid)
  code: string (2-6 chars, unique)
  name: string (max 100)
  kind: 'supreme' | 'high' | 'district' | 'family' | etc.
  locality_id: string (FK localities.id)
  address: string (max 500)
  lat: decimal (nullable)
  lng: decimal (nullable)
  created_at: timestamp
  created_by: string (admin id)
  
  Indexes: (code), (locality_id), (kind)
}
```

### categories (practice areas)
```ts
categories {
  id: string (PK, uuid)
  code: string (2-6 chars, unique)
  slug: string (readable, unique)
  names: jsonb ({ en: string, ml: string })
  
  Examples: code='cv' (civil), code='cr' (criminal), code='pm' (property)
}
```

### page_courts, page_categories, page_languages
```ts
(Each is many-to-many with sort field)
page_courts {
  id: string (PK)
  page_id: string (FK pages.id)
  court_id: string (FK courts.id)
  sort: integer
  deleted_at: timestamp (nullable)
}

(Similar for categories and languages)
```

### career_entries
```ts
career_entries {
  id: string (PK, uuid)
  page_id: string (FK pages.id)
  title: string (max 200)
  description: string (max 1000, nullable)
  year_from: integer (nullable)
  year_to: integer (nullable)
  sort: integer
  created_at: timestamp
  deleted_at: timestamp (nullable)
  
  Constraint: max 5 for basic, 10 for prof/premium (enforced in entitlement)
}
```

### highlights
```ts
highlights {
  id: string (PK, uuid)
  page_id: string (FK pages.id)
  number: string (max 3 digits, e.g., "100")
  label: string (max 20 chars)
  sort: integer
  created_at: timestamp
  deleted_at: timestamp (nullable)
  
  Constraint: max 4 total (only for prof/premium)
}
```

### page_links
```ts
page_links {
  id: string (PK, uuid)
  page_id: string (FK pages.id)
  url: string
  icon_key: string (R2 key for favicon)
  sort: integer
  created_at: timestamp
  deleted_at: timestamp (nullable)
  
  Constraint: max 5 for prof/premium, 0 for basic
}
```

### case_summaries
```ts
case_summaries {
  id: string (PK, uuid)
  page_id: string (FK pages.id)
  court_id: string (FK courts.id)
  role: string (max 100, e.g., "Petitioner Counsel")
  year: integer
  outcome: 'allowed' | 'dismissed' | 'partly_allowed' | 'settled' | 'pending' | 'other'
  note: string (max 500, nullable)
  link: string (URL, nullable, nofollow)
  post_id: string (FK posts.id, nullable)
  sort: integer
  created_at: timestamp
  deleted_at: timestamp (nullable)
  
  Constraint: max 2 for basic, 10 for prof/premium
}
```

### offices
```ts
offices {
  id: string (PK, uuid)
  page_id: string (FK pages.id)
  name: string (max 100)
  is_main: boolean (1 per page only)
  address: string (max 500)
  locality_id: string (FK localities.id)
  phone: string (E.164, for Connect calls)
  phone_verified: boolean (default false, for MVP2)
  about: string (max 1000)
  lat: decimal (nullable)
  lng: decimal (nullable)
  sort: integer
  created_at: timestamp
  deleted_at: timestamp (nullable)
  deleted_by: string (nullable)
  
  Constraint: max 1 for basic, 5 for prof/premium
  Indexes: (page_id), (locality_id)
}
```

### office_courts
```ts
office_courts {
  id: string (PK, uuid)
  office_id: string (FK offices.id)
  court_id: string (FK courts.id)
  sort: integer
  
  (Each office can tag focus courts)
}
```

### memberships (advocate in firm)
```ts
memberships {
  id: string (PK, uuid)
  firm_page_id: string (FK pages.id, type='firm')
  advocate_page_id: string (FK pages.id, type='advocate')
  title: string (e.g., "Senior Counsel")
  office_id: string (FK offices.id, nullable)
  status: 'pending' | 'active' | 'left'
  firm_sort: integer (order in firm's lawyer list)
  office_sort: integer (order in office's lawyer list)
  intro: string (max 200, advocate bio)
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp (nullable)
  
  Constraint: max 5 firms per advocate
  Unique: (firm_page_id, advocate_page_id) when active
}
```

### posts
```ts
posts {
  id: string (PK, uuid)
  page_id: string (FK pages.id)
  type: 'article' | 'court_update'
  title: string (max 200)
  body: string (max 10000)
  cover_image_key: string (R2 key, nullable)
  court_id: string (FK courts.id, nullable)
  source_url: string (nullable, for reference)
  language: 'en' | 'ml'
  status: 'draft' | 'published' | 'deleted'
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp (nullable)
  
  Indexes: (page_id), (status), (court_id)
}
```

### post_categories
```ts
post_categories {
  id: string (PK, uuid)
  post_id: string (FK posts.id)
  category_id: string (FK categories.id)
  sort: integer
  
  (Max 3 categories per post)
}
```

### search_index
```ts
search_index {
  id: string (PK, uuid)
  page_id: string (FK pages.id, unique)
  type: 'advocate' | 'firm' | 'office'
  name: string (indexed for text search)
  district_id: string (FK localities.id)
  district_code: string (2-6 chars)
  locality_codes: string (space-separated, for filtering)
  court_codes: string (space-separated)
  category_codes: string (space-separated)
  language_codes: string (space-separated)
  years: string (space-separated, min-max for experience)
  lat: decimal (nullable, for bounding-box query)
  lng: decimal (nullable)
  plan: 'basic' | 'professional' | 'premium'
  status: 'active' | 'suspended' | 'deleted'
  score: decimal (composite ranking score)
  last_active: timestamp (last edit, view, or Connect)
  
  Indexes: (district_id), (district_code), (status), (plan), 
           (lat, lng) bounding-box, full-text search on name
  
  (Rebuilt whenever page changes)
}
```

### page_daily_events
```ts
page_daily_events {
  id: string (PK, uuid)
  page_id: string (FK pages.id)
  day: date
  host: string ('advocateid.in' or custom domain)
  impressions: integer (appeared in list/search)
  views: integer (page opened)
  connects: integer (Connect button tapped)
  
  Unique: (page_id, day, host)
  Indexes: (page_id, day)
}
```

### reports
```ts
reports {
  id: string (PK, uuid)
  target_type: 'page' | 'post' | 'update'
  target_id: string (uuid)
  reason: string (max 500, user input)
  reporter_ip: string (hashed, nullable)
  status: 'open' | 'investigating' | 'resolved' | 'dismissed'
  created_at: timestamp
  updated_at: timestamp
  admin_notes: string (max 1000, nullable)
  
  Indexes: (target_type, target_id), (status)
}
```

### slug_history
```ts
slug_history {
  id: string (PK, uuid)
  page_id: string (FK pages.id)
  old_slug: string
  new_slug: string
  changed_at: timestamp
  changed_by: string (user or admin id)
  reason: string ('user_request', 'admin_recall', etc.)
  redirect_until: timestamp (12 months from change)
  
  Indexes: (page_id), (old_slug)
}
```

## Schema Rules (CRITICAL)

✅ **MUST IMPLEMENT:**
1. Every table with personal data has `deleted_at`, `deleted_by`
2. Soft delete ONLY (never hard delete user data)
3. Retention periods documented in code comments
4. All timestamps are `timestamp with time zone` (UTC)
5. Booleans stored as integer (0/1) for SQLite → Postgres portability
6. Enums as strings (not integers)
7. FKs have `ON DELETE CASCADE` or `ON DELETE SET NULL` documented
8. Indexes on foreign keys
9. No raw SQL anywhere (use Drizzle queries only)

---

# PART 4: KEY FEATURES

## 1. Authentication (OTP)

**Flow:**
1. User enters mobile number
2. POST `/api/auth/send-otp` → Generate 6-digit OTP, hash, store in D1, send via Twilio
3. Rate limit: 3 attempts per number per hour
4. OTP valid 5 minutes, DB record expires within 24h
5. User enters OTP
6. POST `/api/auth/verify-otp` → Hash input, compare, create session (JWT cookie)
7. Redirect to `/account` or `/manage/new`

**Security:**
- OTP stored as `bcrypt` hash, never plain text
- Rate limit on send endpoint (fail open: return 429)
- Never log OTP or mobile numbers
- Session expires after 30 days inactivity

## 2. Page Model (Advocate/Firm)

**Create:**
- Advocate: name, slug, enrolment_no (mandatory), district, plan
- Firm: name, slug, established_year, district, plan
- POST `/api/pages` → create + add to search_index
- Validate slug: 5-30 chars, a-z0-9-, unique, not reserved

**Edit:**
- Editor: bio, about, banner, photo, courts, categories, etc.
- Live editor (TypeScript, validates on change)
- Banned word check (from AGENTS.md)
- Completeness % calculated
- POST `/api/pages/{id}` → update + rebuild search_index

**Plan Limits (Entitlement Module):**
```ts
// DO NOT scatter in components, centralize here
const planLimits = {
  basic: { banner: false, highlights: 0, links: 0, courts: 5, categories: 5, 
           career: 5, caseSummaries: 2, offices: 1, lawyers: 1 },
  professional: { banner: true, highlights: 4, links: 5, courts: 10, 
                  categories: 10, career: 10, caseSummaries: 10, offices: 5, lawyers: 5 },
  premium: { banner: true, highlights: 4, links: 5, courts: 10, categories: 10, 
             career: 10, caseSummaries: 10, offices: 5, lawyers: 'unlimited' }
};

// On downgrade: keep first N items in user order, hide rest (never delete)
```

## 3. Search & Ranking

**Search Query:**
```
GET /search?district=code&practice=code&court=code&location=code&language=en&experience=5&near_me=true&sort=relevance&first=0&page=1
```

**Filters:**
- `district` (required): 2-6 char code
- `practice`, `court`, `location`, `language`: optional codes
- `experience`: min years
- `near_me`: opt-in geolocation (cookie + DB)
- `sort`: relevance (default), nearest, experienced, newest
- `first={pageId}`: source first (from practice-area click)
- Keyset pagination: `page` parameter (5 results per page, pages 1-5 only)

**Ranking Model (Section 10 of requirements):**
```
Score = 0.45 × Relevance + 0.25 × Nearness + 0.30 × Quality

Relevance = 0.40×practice_area + 0.25×court + 0.10×language + 0.15×text + 0.10×location_name
Nearness = 100×same_locality + 75×same_city + 45×same_district + 15×same_state 
           (or distance if near_me=true)
Quality = 0.25×completeness + 0.25×content + 0.20×engagement + 0.10×experience + 0.10×freshness + 0.10×new_boost

Fairness:
  - Owner & bot loads excluded from engagement calculation (raw data still recorded)
  - One visitor = one count per day (smoothed)
  - Profiles within 5 points shuffled daily
  - No firm takes 2+ consecutive slots
```

**Indexable Routes (Search Engines):**
- `/c/{court-id}/{court-seo}` ✅
- `/l/{locality-id}/{locality-seo}` ✅
- `/l/{locality-id}/{locality-seo}/{practice-code}` ✅
- `/search?district=code` (readable, no query sorting/pagination)
- `/{slug}` (advocate/firm profile) ✅

**Non-Indexable (Noindex + Canonical):**
- Filters beyond district
- Pagination beyond page 5
- Sort parameters (canonical → base page)
- Compare, bookmarks, posts?author=...&category=

## 4. Court Pages

**Route:** `/c/{court-id}/{court-seo}`

**Sections:**
1. **Hero:** Court name, local name, location
2. **Sign-up Banner:** "Add this court to your page" (for logged-in users)
3. **Tabs:**
   - Overview: key-value details (phone, office, hours), map
   - Advocates: filtered by practice area, location, language, experience, sort
   - Newly Joined: advocates who added this court in last 30 days
   - Updates & Posts: court updates + posts with this court tag

**Advocate Cards on Court Page:**
- Photo, name, title, practice areas, location
- Green "Connect" button (opens WhatsApp)
- Checkbox for compare (max 3)
- NO "View profile" button (click card → profile)
- NO court name repeated

## 5. Posts & Court Updates

**User Post:**
- Title, body (10k chars), optional cover image, categories (max 3), court (optional), source URL
- Global page: `/post/{id}/{seo}` (listed in search)
- Author's posts page: `/posts?author={pageId}&category={code}` (noindex)

**Admin Court Update:**
- Form in `/admin` → write to posts table with type='court_update'
- Published immediately with "Official update"
- Contributors (MVP2) can also post updates

## 6. Admin Dashboard (/admin)

**Routes:**
- `/admin` → dashboard overview
- `/admin/courts` → CSV import, edit details
- `/admin/categories` → seed data (hardcoded for MVP1)
- `/admin/pages` → suspend page, recall slug
- `/admin/reports` → list reported pages/posts, approve/dismiss
- `/admin/analytics` → aggregated counts (views by district, etc.)

**Access:** Only users with `admin_role=1` (check in middleware)

**Court CSV Import:**
Columns: name, local_name, kind, state_code, district_code, city_code, address, pincode, latitude, longitude

## 7. Events & Analytics

**Three Event Types:**
1. **Impression:** Page appears in list, search result, similar block, or post
2. **View:** Page is opened (/{slug} loaded)
3. **Connect:** Connect button tapped (WhatsApp link clicked)

**Recording:**
- Every load recorded in `page_daily_events` with host (advocateid.in for MVP1)
- Raw data: each load is separate row (no aggregation yet)
- Flags: owner, likely_bot (stored but not excluded at record time)

**Ranking Uses Cleaned Data:**
- Owner loads filtered out
- Bot loads filtered out
- One visitor per day (rolling 24h window)

**Tools:**
- Own counters in D1 (for ranking, admin dashboard)
- Cloudflare free analytics (per-hostname)
- Google Search Console (SEO monitoring)
- Sentry (error tracking)

## 8. Bookmarks

**Visitor (No Login):**
- Stored in browser cookie: `bookmarks = [slug1, slug2, ...]` (localStorage)

**After Login:**
- Fetch bookmarks from DB (previous cookie merged in)
- Display in `/account/bookmarks`

**Compare:**
- Checkbox on every card (profile, search result, court page)
- Max 3 advocates/firms (mixed allowed)
- Remove button on compare page
- NoIndex on `/compare?a=&b=&c=`

## 9. Slug Management

**Rules:**
- 5-30 chars, a-z0-9-, immutable (change once per 90 days only)
- Global namespace (advocates + firms)
- Reserved words (from requirements): c, l, u, post, posts, practice, search, login, etc.
- When changed: old slug redirects 301 for 12 months, then reserved 90 days

**Admin Actions:**
- Suspend (owner can't act)
- Cancel (delete, but slug reserved 90 days)
- Recall (revert to old slug, if not taken)

## 10. Images & R2

**Upload Flow:**
1. Browser: user selects image
2. Client resizes to 3 sizes in browser (200px, 800px, 1600px wide)
3. Generate 3 WebP/JPEG files
4. Request signed R2 URL from backend: POST `/api/images/upload-url`
5. Upload in background (PWA queue if offline)
6. Backend stores R2 key in DB (original discarded)
7. Serve from R2 via edge cache

**No Originals Kept:** Only 3 resized versions stored

---

# PART 5: TESTING STRATEGY

## Testing Pyramid

```
            │
          Apex      E2E (Playwright later — MVP2)
         │   │
        │     │    Integration (API + DB)
       │       │
      │         │  Unit (logic, validators, queries)
     │           │
    ─────────────
```

## Phase 1 Testing (This Session)

**You will write tests BEFORE committing to any PR.**

### Unit Tests (Jest)

**1. Schema Validation**
```ts
// tests/unit/schema.test.ts
test('accounts table has required fields', () => {
  // Validate Drizzle schema
  expect(schema.accounts).toHaveField('id');
  expect(schema.accounts.id).toHavePrimaryKey();
});

test('pages has soft delete fields', () => {
  expect(schema.pages).toHaveField('deleted_at');
  expect(schema.pages).toHaveField('deleted_by');
});

test('search_index rebuilds correctly', () => {
  // Mock insert page → check search_index updated
});
```

**2. OTP Auth**
```ts
// tests/unit/auth.test.ts
test('sends OTP via Twilio', async () => {
  const result = await sendOTP('9876543210');
  expect(result).toHaveProperty('expiresAt');
  expect(mockTwilio.send).toHaveBeenCalled();
});

test('rate limits OTP: max 3 per hour', async () => {
  await sendOTP('9876543210');
  await sendOTP('9876543210');
  await sendOTP('9876543210');
  expect(sendOTP('9876543210')).rejects.toThrow('rate_limited');
});

test('OTP hashed in DB, never plain text', async () => {
  await sendOTP('9876543210');
  const record = await db.otp_records.findOne();
  expect(record.otp_hash).not.toBe('123456');
  expect(record.otp_hash).toMatch(/^\$2[aby]\$/); // bcrypt
});

test('verifyOTP returns session token', async () => {
  const { expiresAt } = await sendOTP('9876543210');
  const session = await verifyOTP('9876543210', '123456');
  expect(session).toHaveProperty('token');
  expect(session).toHaveProperty('expiresAt');
});
```

**3. Banned Words**
```ts
// tests/unit/validate.test.ts
test('detects banned words', () => {
  const banned = ['best', 'top', 'leading', 'hire', 'book now'];
  banned.forEach(word => {
    expect(hasBannedWords(`Try our ${word} services`)).toBe(true);
  });
});

test('allows fact-based wording', () => {
  expect(hasBannedWords('Represented petitioner. Outcome: allowed.')).toBe(false);
});

test('case-insensitive', () => {
  expect(hasBannedWords('We are the BEST lawyers')).toBe(true);
});
```

**4. Search Ranking**
```ts
// tests/unit/search.test.ts
test('calculates ranking score correctly', () => {
  const page = { relevance: 0.8, nearness: 0.9, quality: 0.7 };
  const score = rankScore(page);
  expect(score).toBeCloseTo(0.45*0.8 + 0.25*0.9 + 0.30*0.7, 2);
});

test('excludes owner loads from engagement', () => {
  const events = [
    { owner: true, type: 'view' },
    { owner: false, type: 'view' },
    { owner: false, type: 'view' },
  ];
  const cleanedEngagement = cleanEvents(events, 'owner');
  expect(cleanedEngagement.views).toBe(2);
});

test('one visitor per day', () => {
  const events = [
    { visitor_id: 'abc', timestamp: '2025-01-15 10:00', type: 'view' },
    { visitor_id: 'abc', timestamp: '2025-01-15 15:00', type: 'view' },
  ];
  const smoothed = smoothEventsByVisitor(events, '1 day');
  expect(smoothed.length).toBe(1);
});
```

### Integration Tests (Jest + Mock D1)

```ts
// tests/unit/page-crud.test.ts
test('creates advocate page with validation', async () => {
  const page = {
    name: 'Advocate John',
    slug: 'john-law',
    enrolment_no: 'AP/2023/1234',
    district_id: 'ap_hyd',
    plan: 'professional'
  };
  const created = await createPage(page);
  expect(created.id).toBeTruthy();
  expect(await getPageBySlug('john-law')).toEqual(created);
});

test('rejects duplicate slug', async () => {
  await createPage({ slug: 'john-law', ... });
  expect(createPage({ slug: 'john-law', ... })).rejects.toThrow('slug_exists');
});

test('enforces plan limits on creation', async () => {
  const page = await createPage({ plan: 'basic', ... });
  // Try add 2 case summaries (basic limit = 2)
  await addCaseSummary(page.id, { ... });
  await addCaseSummary(page.id, { ... });
  // 3rd should fail
  expect(addCaseSummary(page.id, { ... })).rejects.toThrow('limit_exceeded');
});
```

### CI/CD Tests (GitHub Actions)

**File: `.github/workflows/ci.yml`**

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: TypeScript check
        run: npm run type-check
      
      - name: Unit tests
        run: npm run test:unit
      
      - name: Build
        run: npm run build
      
      - name: Check secrets
        run: |
          if grep -r "sk_live\|sk_test" src/ tests/ --include="*.ts" --include="*.tsx"; then
            echo "❌ Found secrets in code!"
            exit 1
          fi
      
      - name: Dry-run deploy
        run: npm run deploy:dry
```

**Package.json Scripts:**
```json
{
  "scripts": {
    "lint": "eslint src tests --fix",
    "type-check": "tsc --noEmit",
    "test:unit": "jest --coverage",
    "test:watch": "jest --watch",
    "build": "next build",
    "deploy": "wrangler deploy",
    "deploy:dry": "wrangler deploy --dry-run"
  }
}
```

---

# PART 6: PRE-COMMIT CHECKLIST

**BEFORE EVERY COMMIT, Claude Code MUST check:**

```
COMPLIANCE:
  ☐ No hardcoded strings (all UI text in locales/en.json)
  ☐ No personal data logged to console
  ☐ No mobile numbers or IPs in error messages
  ☐ OTP endpoints rate-limited
  ☐ All tables with personal data have deleted_at
  ☐ Banned word check added to validators
  ☐ Plan limits in entitlement module (not scattered)

SCHEMA:
  ☐ All FKs indexed
  ☐ Soft deletes on data tables
  ☐ Retention periods documented in comments
  ☐ No SQLite-only syntax (Postgres-portable)
  ☐ Enums as strings, booleans as integers
  ☐ Timestamps in UTC

CODE:
  ☐ No raw SQL (all Drizzle queries)
  ☐ TypeScript strict mode, no `any`
  ☐ All async functions have error handling
  ☐ Tests pass: `npm run test:unit`
  ☐ Lint passes: `npm run lint`
  ☐ Build passes: `npm run build`
  ☐ No secrets in code
  ☐ No real personal data in fixtures

GIT:
  ☐ Commit message: concise, references issue if any
  ☐ One logical change per commit
  ☐ `.env.local` NOT in git (use .env.local.example)
  ☐ `node_modules/`, `.wrangler/` in .gitignore
  ☐ PR description explains "why" and "what"
  ☐ Note any open questions in comments
```

---

# PART 7: INSTRUCTIONS FOR CLAUDE CODE

## BEFORE YOU START

1. **Read this entire file**
2. **Read AGENTS.md** (compliance rules)
3. **Read PROJECT_REQUIREMENTS_v6.md** (feature spec)
4. **Read design files** (component library)

## YOUR PHASES

### PHASE 1: INITIALIZATION (Session 1)
**Time:** 30-40 minutes | **Credit:** ~$20

**Input:**
- Git repo with `package.json` (Next.js + Drizzle + Wrangler ready)
- `wrangler.toml` template
- `.env.local.example` template

**Deliverables:**
1. **Drizzle schema** (`src/db/schema.ts`)
   - All 20+ tables from Part 3
   - Soft deletes, FKs, indexes
   - Postgres-portable (no SQLite-only syntax)
   - Retention periods documented
   
2. **Migrations** (`src/db/migrations/`)
   - Generated by Drizzle CLI
   - Seed data: 5 test advocates + 3 courts (fake names)
   
3. **Tests** (`tests/unit/schema.test.ts`)
   - Validate schema fields
   - Verify soft deletes on all tables
   - Check indexes exist
   
4. **GitHub Actions** (`.github/workflows/ci.yml`)
   - Lint, TypeScript, test, build, dry-run deploy
   
5. **PR to staging**
   - Title: `feat: initialize schema and migrations`
   - Description: List all tables, explain decisions
   - All CI checks passing

**Testing Before Commit:**
```bash
npm run type-check          # TypeScript errors?
npm run lint                # ESLint errors?
npm run test:unit           # Tests pass?
npm run build               # Build works?
npm run deploy:dry          # Dry-run OK?
# If ALL green ✅ → commit and push
```

---

### PHASE 2: AUTH & ADMIN BACKEND (Session 2)
**Time:** 30-40 minutes | **Credit:** ~$20

**Input:**
- Phase 1 merged to staging
- Twilio account SID + token (in .env.local)

**Deliverables:**
1. **OTP Auth**
   - `src/lib/auth.ts`: sendOTP, verifyOTP, createSession
   - POST `/api/auth/send-otp` (rate limited: 3/hour)
   - POST `/api/auth/verify-otp`
   - Session token (JWT cookie, 30-day expiry)
   
2. **Admin Auth Middleware**
   - `src/middleware.ts`: check `admin_role=1`
   - Protect `/admin/*` routes
   
3. **Admin Backend**
   - POST `/api/admin/courts/import` (parse CSV)
   - POST `/api/admin/pages/{id}/suspend`
   - POST `/api/admin/pages/{id}/recall-slug`
   - GET `/api/admin/reports` (list flagged content)
   
4. **Tests** (`tests/unit/auth.test.ts`)
   - OTP generation, rate limiting, hashing
   - Session creation and validation
   
5. **PR to staging**
   - Title: `feat: OTP auth and admin backend`
   - Testing: `npm run test:unit -- auth`

---

### PHASE 3: PAGE CRUD & EDITOR (Session 3)
**Time:** 40-50 minutes | **Credit:** ~$30

**Input:**
- Phase 2 merged
- Design component files (Buttons, Cards, Forms)

**Deliverables:**
1. **Page Model**
   - POST `/api/pages` (create advocate/firm)
   - GET `/api/pages/{id}` (fetch profile)
   - PATCH `/api/pages/{id}` (update bio, about, etc.)
   - DELETE `/api/pages/{id}` (soft delete)
   - Slug validation: 5-30 chars, unique, not reserved
   
2. **List Editors**
   - Courts, categories, languages (many-to-many)
   - Offices (1-to-many)
   - Career entries, highlights, links
   - Add, remove, reorder (sort field)
   
3. **Live Editor UI**
   - `/manage/{pageId}` page
   - Side panel (desktop) / bottom sheet (mobile)
   - Edit fields with validation
   - Banned word validator (shows warning)
   - Completeness % calculation
   
4. **Image Upload**
   - POST `/api/images/upload-url` (signed R2 URL)
   - Browser resize to 3 sizes (200px, 800px, 1600px)
   - Store R2 key in DB
   - No original kept
   
5. **Entitlement Module** (`src/lib/entitlement.ts`)
   - Plan limits (basic, professional, premium)
   - Enforced in all add/edit endpoints
   - On downgrade: hide extra items, never delete
   
6. **Tests** (`tests/unit/page-crud.test.ts`)
   - Create/edit/delete pages
   - Slug uniqueness
   - Plan limit enforcement
   - Banned word detection
   
7. **PR to staging**
   - Title: `feat: page CRUD and live editor`

---

### PHASE 4: SEARCH & RANKING (Session 4)
**Time:** 30-40 minutes | **Credit:** ~$20

**Input:**
- Phase 3 merged
- Ranking model (Part 4, Section 3)

**Deliverables:**
1. **Search Index Table**
   - Denormalized, rebuilt on page change
   - Keyset pagination (cursor-based)
   - Bounding-box index (lat/lng)
   - Full-text search on name
   
2. **Search API**
   - GET `/search?district=code&practice=code&...`
   - Filter by: district (required), practice, court, location, language, experience
   - Sort: relevance (default), nearest, experienced, newest
   - Keyset pagination: page 1-5 only (noindex beyond)
   
3. **Ranking Algorithm**
   - Score = 0.45×Relevance + 0.25×Nearness + 0.30×Quality
   - Detailed formula in Part 4
   - Freshness boost, engagement cap, fairness shuffle
   
4. **Tests** (`tests/unit/search.test.ts`)
   - Ranking score calculation
   - Owner/bot load exclusion
   - One visitor per day smoothing
   - Keyset pagination
   
5. **PR to staging**
   - Title: `feat: search indexing and ranking`

---

### PHASE 5: COURT PAGES & BROWSE (Session 5)
**Time:** 30-40 minutes | **Credit:** ~$20

**Input:**
- Phase 4 merged
- Design files: ProfileCard, AdvocateCard, Tabs

**Deliverables:**
1. **Court Page** (`/c/{court-id}/{court-seo}`)
   - Hero: court name, local name, location
   - Sign-up banner (logged-in users: "Add to my page")
   - Tabs: Overview (key-value + map), Advocates, Newly Joined, Updates
   - Advocate cards: photo, name, practice areas, Connect button, compare checkbox
   
2. **Location Pages**
   - `/l/{locality-id}/{locality-seo}` (list advocates in locality)
   - `/l/{locality-id}/{locality-seo}/{practice-code}` (with practice filter)
   
3. **Routes & SEO**
   - Indexable: `/c/...`, `/l/...`, `/{slug}`, `/post/...`
   - Noindex: filters, pages >5, `/compare`, `/search?...`
   - Canonical links
   - JSON-LD: Attorney, LegalService, Organization, Article, Breadcrumb
   
4. **Tests** (`tests/unit/court-pages.test.ts`)
   - Court page renders advocates in ranking order
   - Sign-up banner shows for logged-in users
   - SEO tags correct (canonical, hreflang)
   
5. **PR to staging**
   - Title: `feat: court pages and location browsing`

---

### PHASE 6: POSTS & EVENTS (Session 6)
**Time:** 30-40 minutes | **Credit:** ~$20

**Input:**
- Phase 5 merged

**Deliverables:**
1. **Posts**
   - POST `/api/posts` (create post: title, body, categories, court, source)
   - GET `/post/{id}/{seo}` (global post page)
   - GET `/posts?author={pageId}&category={code}` (author's posts + similar, noindex)
   
2. **Court Updates**
   - Admin creates via `/admin` form
   - Stored as post with type='court_update'
   - Published immediately with "Official update" label
   
3. **Events**
   - POST `/api/events` (impressions, views, connects)
   - Store in `page_daily_events` (per host, per day)
   - Raw data: every load recorded
   - Flags: owner, likely_bot (for later ranking)
   
4. **Tests** (`tests/unit/posts.test.ts`)
   - Create post, verify search_index updated
   - Event counting accuracy
   
5. **PR to staging**
   - Title: `feat: posts, court updates, and event tracking`

---

### PHASE 7: BOOKMARKS & COMPARE (Session 7)
**Time:** 20-30 minutes | **Credit:** ~$15

**Input:**
- Phase 6 merged

**Deliverables:**
1. **Bookmarks**
   - Cookie-based (visitor): `bookmarks = [slug1, slug2, ...]`
   - DB-based (logged-in): merge cookie on login
   - GET `/account/bookmarks` page
   
2. **Compare**
   - Checkbox on every advocate/firm card
   - Max 3 (mixed advocates and firms)
   - GET `/compare?a=&b=&c=` (noindex)
   - Remove button on compare page
   - Rows: type, experience, courts, practice areas, case outcomes, posts per category
   
3. **Tests**
   - Cookie → DB merge on login
   - Compare limit enforced
   
4. **PR to staging**
   - Title: `feat: bookmarks and compare feature`

---

### PHASE 8: ADMIN UI & MONITORING (Session 8)
**Time:** 30-40 minutes | **Credit:** ~$20

**Input:**
- Phases 1-7 merged

**Deliverables:**
1. **Admin Dashboard** (`/admin`)
   - Overview: page count, active users, events this month
   - Court upload form (CSV drag-drop)
   - Page suspension form (select page, reason)
   - Slug recall form (enter old slug, check availability)
   - Reports list (flag reason, approve/dismiss buttons)
   - Analytics: views by district, top pages
   
2. **Monitoring**
   - Sentry error tracking (npm install @sentry/nextjs)
   - Cloudflare Logs viewer (dashboard link)
   - Health check endpoint: GET `/api/health` (DB, R2, Twilio status)
   
3. **Tests**
   - Admin auth enforced
   - CSV import validation
   
4. **PR to staging**
   - Title: `feat: admin dashboard and monitoring`

---

### PHASE 9: POLISH & QA (Session 9)
**Time:** 20-30 minutes | **Credit:** ~$15

**Input:**
- Phases 1-8 merged

**Deliverables:**
1. **Code Quality**
   - TypeScript strict mode
   - ESLint + Prettier (all files)
   - Remove `console.log`, unused imports
   - Improve error messages
   
2. **Tests**
   - Bring coverage to 80%+
   - Fix flaky tests
   
3. **SEO & Accessibility**
   - JSON-LD on all pages (Attorney, LegalService, Article, Breadcrumb)
   - Robots.txt, sitemap.xml
   - WCAG AA: contrast, focus, keyboard nav, reduced motion
   - Lighthouse score > 80
   
4. **PWA**
   - Web manifest (`public/manifest.json`)
   - Service worker skeleton
   - Install prompt
   
5. **Performance**
   - Image lazy loading
   - Font optimization (support Malayalam)
   - Bundle size check
   
6. **Tests Before Merge**
   - `npm run lint`
   - `npm run type-check`
   - `npm run test:unit --coverage`
   - `npm run build` (check bundle size)
   
7. **PR to staging**
   - Title: `refactor: polish, QA, and optimization`

---

### PHASE 10: DEPLOY & STAGING (Session 10)
**Time:** 20-30 minutes | **Credit:** ~$10

**Input:**
- Phase 9 merged to staging

**Deliverables:**
1. **Environment Setup**
   - `.env.staging` (Twilio test SID, Cloudflare staging IDs)
   - Wrangler deploy to staging environment
   
2. **Smoke Tests**
   - Create test account via OTP
   - Create test advocate page
   - Search for it
   - Verify in admin dashboard
   
3. **Documentation**
   - README: local dev setup, deploy commands
   - docs/API.md (all endpoints + example requests/responses)
   - docs/TESTING.md (how to run tests locally)
   - docs/SCHEMA.md (data model explanation)
   
4. **Deploy Command**
   - `npm run deploy` → pushes to Cloudflare (staging → staging, main → production)
   
5. **Final Checklist**
   - [ ] All tests pass
   - [ ] No secrets in code
   - [ ] No real personal data in fixtures
   - [ ] Staging URL works: https://staging.advocateid.in
   - [ ] Admin login works
   - [ ] OTP flow works
   - [ ] Search returns results
   - [ ] Database queries fast (Lighthouse > 80)
   
6. **PR to main** (production)
   - Title: `chore: deploy MVP1 to production`
   - Description: Checklist above + any known issues
   - Require review before merge

---

## TESTING REQUIREMENTS (CRITICAL)

### Before EVERY Commit

```bash
# 1. Lint (auto-fix)
npm run lint

# 2. Type check
npm run type-check

# 3. Run unit tests
npm run test:unit

# 4. Build check
npm run build

# 5. Dry-run deploy
npm run deploy:dry

# ALL MUST PASS ✅ before commit
```

### Each PR Must Include

1. **Test Coverage Report**
   ```
   npm run test:unit -- --coverage
   # Output shows: statements, branches, functions, lines
   # Target: 80%+ coverage
   ```

2. **Build Size Check**
   ```
   npm run build
   # Output: next.js bundle size
   # Alert if > 500KB (uncompressed)
   ```

3. **Lighthouse Score**
   ```
   # Run locally or wait for Vercel preview
   # Target: Performance > 80, Accessibility > 90
   ```

4. **No Secrets**
   ```bash
   if grep -r "sk_\|pk_\|AKIA\|Begin Private" src/ tests/ --include="*.ts"; then
     echo "❌ SECRETS FOUND!"
     exit 1
   fi
   ```

---

## LOGGING IN FOR TESTING

**Test OTP Flow Locally:**
```bash
# Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env.local
# Set TWILIO_PHONE to your dev number (or mock in tests)

# In browser:
# 1. Go to http://localhost:3000/login
# 2. Enter: 9876543210 (test number)
# 3. Check console or Twilio logs for OTP
# 4. Enter OTP (tests use 123456 by default)
# 5. Should redirect to /account
```

**Test Admin Login:**
```bash
# Set ADMIN_ROLE=1 in .env.local for your test account
# Login as normal
# Visit http://localhost:3000/admin
# Should see dashboard
```

---

## GIT WORKFLOW

```bash
# Start each session
git checkout staging
git pull origin staging
git checkout -b feat/phase-{n}-{description}

# After coding
git add .
git commit -m "feat: {clear description of changes}"
  # Examples:
  # "feat: initialize drizzle schema with 20+ tables"
  # "feat: implement OTP auth with rate limiting"
  # "feat: add search indexing and ranking"

# Before push, run all tests
npm run lint && npm run type-check && npm run test:unit && npm run build

# Push to GitHub
git push origin feat/phase-{n}-{description}

# Create PR on GitHub
# Title: feat: {description}
# Description: explain what + why + testing notes

# Wait for CI (GitHub Actions) to pass
# Once green ✅, reviewer approves, then merge to staging
# (You won't be there, so make sure CI is thorough)
```

---

## IF SOMETHING BREAKS

**You're sleeping, but the tests should catch it.**

**Example:** If schema is wrong, `npm run test:unit` fails → PR shows red X → no merge.

**Example:** If SQL is not using Drizzle, ESLint fails → PR shows red X → no merge.

**If tests pass but something is still wrong:**
1. Check the PR description for questions you left for yourself
2. Run locally in morning: `npm run dev`
3. Reproduce the bug
4. Create new branch, fix, push PR again

---

# PART 8: STARTING NOW

## Step 1: Prepare Your Repo
```bash
git clone <your-repo>
cd advocateid

# Create basic structure
mkdir -p src/{db,app,components,lib,types} tests/unit public/locales docs
touch .env.local.example wrangler.toml drizzle.config.ts

# Copy templates (provided in repo)
# - package.json (Next.js + Drizzle + Wrangler)
# - tsconfig.json
# - .gitignore (include .env.local, .wrangler/)
```

## Step 2: Open Claude Code Cloud Session
```
Paste this entire INSTRUCTIONS.md file as the prompt.

Also attach:
- AGENTS.md
- PROJECT_REQUIREMENTS_v6.md
- Design HTML files (or paste component specs)

Set instruction: "PHASE 1: INITIALIZATION"
```

## Step 3: Go to Sleep 😴

Claude Code will:
1. Read all context
2. Create schema (`src/db/schema.ts`)
3. Generate migrations
4. Write unit tests
5. Set up GitHub Actions
6. Commit to feature branch
7. Create PR to staging

## Step 4: Wake Up & Review
```
Check GitHub:
1. PR created: feat/phase-1-initialize-schema
2. All CI checks green ✅
3. Code review the changes
4. Approve & merge to staging
```

## Step 5: Repeat for Phases 2-10
```
Each morning (or next session):
1. Check what was merged
2. Test staging.advocateid.in (if deployed)
3. Start next phase
```

---

# FINAL CHECKLIST BEFORE YOU START CLAUDE CODE

- [ ] GitHub repo created + Claude Code connected
- [ ] AGENTS.md in repo (Section 2: DPDP rules, Section 3: Bar Council wording)
- [ ] PROJECT_REQUIREMENTS_v6.md in repo (full spec)
- [ ] Design HTML files saved (buttons, cards, forms, colors, fonts)
- [ ] Twilio account created (free dev tier) + SID in environment notes
- [ ] Cloudflare account + D1 database created + ID ready
- [ ] R2 bucket created + credentials ready
- [ ] Node.js 18+ installed locally (for testing later)
- [ ] `wrangler.toml` template created
- [ ] `.env.local.example` template created
- [ ] You've read this entire file

**THEN:**

🚀 **Start Claude Code Cloud session. Paste this file + AGENTS.md + requirements + design files.**

**Go to sleep.**

**Wake up to tested, working MVP1 code.**

---

**Questions about this plan?** Ask before starting the Claude Code session. Otherwise, let it build.

**Good luck! 🎯**
