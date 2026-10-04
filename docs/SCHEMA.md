# Database schema

PostgreSQL via Drizzle (`src/db/schema.ts`, migrations in `src/db/migrations`). Portability rules: no arrays, jsonb or enums; code lists are delimited text matched with LIKE; every table holding user data has `deleted_at`/`deleted_by`; every list has `sort`. There are no foreign-key constraints (soft delete and purge jobs manage references); ids are integer identity columns.

| Table | Purpose | Personal data and retention |
|---|---|---|
| `accounts` | One mobile login = one account | mobile; kept while the account exists, erased 30 days after a deletion request |
| `sessions` | Login sessions (token stored as SHA-256) | none; expire after 30 days, purged nightly |
| `otp_logs` | OTP hashes (HMAC), never plaintext | mobile hash; 7 days |
| `rate_limits` | Fixed-window rate limiter keyed by one-way hashes | hashes only; 24 hours |
| `account_consents` | Consent audit trail | account id; 3 years |
| `audit_log` | Admin and wording-flag audit | actor id; 1 year |
| `localities` | States, districts, cities, areas (seeded) | none |
| `courts` | Court list (admin CSV import, then edited) | none |
| `court_translations` | Court names per language | none |
| `court_details` | Key-value details per court | none |
| `categories` | Practice areas (master list) | none |
| `category_translations` | Practice area names per language | none |
| `pages` | Advocate and firm pages | name, photo, bio, contact mobile; page life + 30 days |
| `page_advocate` | Enrolment number (declared) and year | enrolment no; page life + 30 days |
| `page_firm` | Year established | none |
| `page_custom` | Brand colour and toggles | none |
| `page_seo` | SEO fields | none |
| `domains` | Custom domains (Premium) | hostname; page life |
| `slug_history` | Redirects (12 months) and reservations (90 days) | old slug |
| `page_photos` | Stored image keys (three sizes) | image; page life + 30 days |
| `page_courts` | Courts of practice (ordered) | none |
| `page_categories` | Practice areas (ordered) | none |
| `page_languages` | Languages | none |
| `career_entries` | Career timeline | page life |
| `highlights` | Number + fixed label | none |
| `page_links` | Extra links with icon key | none |
| `case_summaries` | Court, year, role, outcome, short note | page life |
| `offices` | Offices with own number, hours, description, lat/lng | phone; page life + 30 days |
| `office_courts` | Focus courts per office | none |
| `memberships` | Advocate in firm (request, invite, approval) | page life |
| `posts` | Articles and court updates | author text; page life |
| `post_categories` | Post tags | none |
| `reports` | Reports of pages, posts, updates | free text details; kept until resolved |
| `grievances` | Grievance officer queue | name, contact; 3 years after resolution |
| `contact_messages` | Contact page and missing-court requests | name, contact; 90 days |
| `bookmarks` | Saved pages for signed-in users | account id; account life + 90 days |
| `page_events_raw` | Every impression, view and Connect tap with owner/bot flags | rotating visitor id; 30 days |
| `page_daily_events` | Daily counters per page and host (cleaned and raw) | none; 1 year |
| `page_scores` | Nightly quality score | none |
| `search_index` | One row per page and per office with description, for search and ranking | derived; rebuilt on every change |
