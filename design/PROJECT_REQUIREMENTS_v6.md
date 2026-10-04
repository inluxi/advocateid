# advocateid.in — Requirements v6 (MVP 1 baseline)
 
*Supersedes v1 to v5. Add this file to the Claude Project knowledge and remove older requirement files so they do not conflict.*
*Sources: project chats, `project_review_v1.md`, founder answers up to 1 Oct 2026, prototype v2 review.*
*Labels: **MVP1** first release · **MVP2** next · **MVP3** later · ⚖️ counsel review · (Qn) = open question in Section 14. Not legal advice.*
 
---
 
## 0. What changed since v5
 
| Area | Change |
|---|---|
| Premium indexing | Once a custom domain is active, **search engines index the custom domain only**. advocateid.in/{slug} stays usable inside the site but is excluded from search engines (canonical points to the domain). Before a domain is active, advocateid.in/{slug} is indexed as normal |
| Premium address | `{slug}.p.advocateid.in` is the **CNAME target** for the owner's domain. It is hidden from indexing. How it works technically is an open experiment (T7) |
| Domain lapse | If the domain stops working, advocateid.in/{slug} keeps working, the owner sees a warning, and the domain drops out of the sitemap. Nothing is lost |
| Events | Views, impressions and Connect taps are recorded **separately** for advocateid.in and for each custom domain. **Every load is recorded** (no bot or owner exclusion in the raw data). Ranking still uses cleaned counts. No dashboard in MVP 1 |
| Analytics tools | Own counters for ranking and admin; Cloudflare's per-hostname analytics; Google Search Console. GA4 only later, with consent (Section 9) |
| Professional practice-area click | Opens `/posts?author={pageId}&category={code}`: the author's latest post in that category, their other posts, and snapshots of similar latest posts from others. Noindex. If there is no post, it falls back to search with the source first |
| Court seeding | **Admin CSV upload** of the all-India court list (with address and optional coordinates). No CSV for court updates |
| Lawyers route | `/{slug}/lawyers` and `/lawyers/{name}` on a firm's domain. The visible label waits for keyword research |
| Compare | Advocates and firms can be mixed; remove button; no enrolment number or verified mark |
| Leaving a firm | The advocate can leave on their own; the firm can remove at any time |
| Completeness | Shown to the owner only |
| Basic plan | No banner image |
| Install prompt | PWA install prompt in MVP 1. Push notifications in MVP 2 |
| Compliance | Strict DPDP Act compliance from day one and Bar Council wording rules, both written into `AGENTS.md` (T6) |
| Pages removed from MVP 1 | Jobs, analytics page, billing page, address-verification page, bar association page, separate near-me page |
 
---
 
## 1. Product snapshot
 
**advocateid.in** is an SEO-first directory of advocates and law firms in India. Courts, locations and practice areas are seeded. Court updates and location pages bring traffic. Every court page invites advocates to create a page and be listed. Advocates and firms publish posts and share them in WhatsApp groups, which brings more visitors and more advocates.
 
Not in MVP 1: payments, analytics dashboard, jobs, reviews and ratings, verified seal, bar association pages, case status search, matters and quotes, push notifications.
 
---
 
## 2. Locked decisions
 
| # | Decision | Label |
|---|---|---|
| D1 | Lawyers and law firms only | MVP1 |
| D2 | Mobile OTP login. An account can own **3 pages** in total (advocate and firm pages count). A deleted page frees its slot after 30 days (soft delete only) | MVP1 |
| D3 | Acting as a page: a login is an account, not a person. The user picks which page acts (posts, court additions, requests) | MVP1 |
| D4 | Plans: Basic free · Professional ₹599/month or ₹6,000/year · Premium ₹999/month or ₹10,000/year (INR incl. GST). Admin assigns plans in MVP 1 | MVP1 / payments MVP2 |
| D5 | Payment: Razorpay recurring (Cashfree and PhonePe available). Gateway needs the live site reviewed | MVP2 |
| D6 | Custom domain (CNAME) via Cloudflare for SaaS (100 hostnames included) | MVP1 |
| D7 | Stack: Next.js on Cloudflare Workers, D1 now and Postgres later via Drizzle ORM, wrangler CLI, Git merge to deploy (`main` = production, `staging` = preview) | MVP1 |
| D8 | Images on Cloudflare R2, resized in the browser, background upload in the PWA (Section 8) | MVP1 |
| D9 | Page address (slug): 5 to 30 characters, a-z, digits, hyphen. One namespace for advocates and firms. Admin can suspend, cancel or recall with or without notice. A deleted page's slug is reserved for 90 days | MVP1 |
| D10 | Courts seeded by admin CSV upload. Admin edits details in the back office. No user-added courts; a missing court is requested through the contact page | MVP1 |
| D11 | Practice areas come from a database master list | MVP1 |
| D12 | Career timeline is edited by the owner only. "Achievement timeline" and "career timeline" are the same. Basic 5 entries, others 10 | MVP1 |
| D13 | Plan never changes ranking (Section 10) | MVP1 |
| D14 | No Verified seal. Enrolment number is self-declared, mandatory for advocate pages, shown on the profile, hidden on compare | MVP1 |
| D15 | Bookmarks: cookie for visitors, database after login (merged) | MVP1 |
| D16 | Search filters use short codes in query parameters. Indexable pages use readable path URLs | MVP1 |
| D17 | Premium pages show as Professional pages on advocateid.in and as a white-label site on their own domain. Search engines index the domain only | MVP1 |
| D18 | Use "Office" (main and branch) in the product | MVP1 |
| D19 | Reviews (text) by signed-in visitors | MVP2 ⚖️ |
| D20 | Jobs: Professional and Premium pages post, no CV | MVP2 |
| D21 | Postal address verification: `address_verified` default 0 now, letters later | MVP2 |
| D22 | Star ratings, verified seal, bar associations, paid themes, Hindi and more languages, Postgres move, case status link | MVP3 |
| D23 | Matters and quotes: high legal risk ⚖️; decide after counsel | MVP3 or never |
| D24 | Every page, post and update can be reported without login. Admin can suspend a page, post or update (jobs later) | MVP1 |
| D25 | Strict DPDP Act 2023 compliance from day one, stated in `AGENTS.md` | MVP1 |
| D26 | PWA with install prompt. Push notifications later | MVP1 / MVP2 |
 
---
 
## 3. Plan matrix
 
| Feature | Basic | Professional | Premium |
|---|---|---|---|
| Price per month / year | Free | ₹599 / ₹6,000 | ₹999 / ₹10,000 |
| Profile picture | Yes | Yes | Yes |
| Banner image | **No** | Yes | Yes |
| Page bio (500) and About (5,000) | Yes | Yes | Yes |
| Courts of practice | 5 | 10 | 10 |
| Practice areas | 5 | 10 | 10 |
| Career timeline entries | 5 | 10 | 10 |
| Case summaries | 2 | 10 | 10 |
| Offices (main included) | 1 | 5 | 5 |
| Lawyers on a firm page | 1 | 5 | Unlimited |
| Highlights (4 max; number up to 3 digits; label up to 20 characters) | No | Yes | Yes |
| Extra links (5, auto icons) | No | Yes | Yes |
| SEO fields | Yes | Yes | Yes |
| Competitor blocks on own page | Nearby and similar advocates shown | Hidden | Hidden |
| Layout | Simple header | Masthead, stat strip, tabs | Own-website look, own colour, no platform header |
| Approve lawyers joining (firms) | No | Yes | Yes |
| "Member of" list | Shown | Shown | Optional toggle |
| Own domain | No | No | Yes |
 
**Downgrade:** keep the first N items in the owner's order, hide the rest (nothing is deleted).
 
---
 
## 4. Personal page vs firm page
 
One page engine with a `type` flag. Shared: profile picture, banner, bio, About, highlights, links, courts, practice areas, timeline, case summaries, posts, SEO fields. Differences:
 
| Area | Advocate page | Firm page |
|---|---|---|
| Identity fields | Enrolment number (mandatory), year enrolled | Year established |
| People | "Member of" firms, each with title | Lawyers section: moderate photo, title at office, 200-character intro |
| Offices | Own offices | Main and branch offices, each with own page, number and focus courts |
| Approvals | Requests to join a firm | Approves and orders lawyers |
| Search schema | Attorney | LegalService |
| Premium extras | "Member of" toggle | In-domain lawyer pages |
 
---
 
## 5. Key behaviours
 
### 5.1 Court page (the main sales page) — MVP1
- Hero with name, location (and local-language name), a sign-up banner under the hero, and a second call to action at the bottom of the page.
- Tabs: **Overview** (latest updates, key-value details, map) · **Advocates** (filters: practice area, location, language, experience, sort) · **Newly joined** · **Updates and posts**.
- Key-value details: court, display order, key name, value (for example "Phone, Office").
- Advocate cards: photo, name, title, practice areas, **green Connect button**, compare tick. No "View profile" button and no court name repeated.
- A logged-in user who owns an advocate page sees "Add this court to my page" (choose which page when there is more than one).
- Case status search: MVP3.
 
### 5.2 Search — MVP1
One page, filters in query parameters with short codes: district (required), q, practice area, court, location, language, experience, near me, type (advocate / firm / office), sort, first, page. Only these are indexable, and only as readable path pages: district, district + practice area, court, court + practice area, location, location + practice area. Everything else is `noindex` with a canonical link to the base page. Short codes give no SEO benefit; they only keep shared links short.
 
### 5.3 Offices — MVP1
Every office has its own page, address, latitude and longitude, contact hours, **own mobile number (OTP; not for login)**, **focus courts** chosen by the office, local description and the lawyers at that office. The office page has Connect and Call. An office without its own description stays out of search results.
 
### 5.4 Practice-area click
| Where | Result |
|---|---|
| Basic page | Search results for that practice area, source listed first (`first=`) |
| Professional page (and Premium on advocateid.in) | `/posts?author=&category=`: the author's latest post in the category, their other posts, snapshots of similar latest posts from others. No post: falls back to search with the source first |
| Premium on custom domain | Own posts in that category. If none, the author's other posts. Other authors limited to colleagues in the same firm. Never leaves the domain |
 
### 5.5 Post pages — MVP1
- Global post page `/post/{id}/{seo}`: post, author card, author's other posts, similar latest posts from other advocates ⚖️. Canonical for Basic and Professional authors.
- On a Premium custom domain the post lives at `/p/{id}/{seo}`, shows only the author's and colleagues' posts, and is the canonical copy. The global copy is excluded from search engines.
- Post fields: title, body up to 10,000 characters, cover image, up to 3 categories, language, optional court, source link. Every post can carry a court tag.
 
### 5.6 Court updates and reports — MVP1
Admin creates official updates in a back-office web form (no CSV). Any page can also contribute an update like a post: court and source link are mandatory; it is published at once with "Contributed by [page]"; the author is responsible; anyone can report it; admin can suspend it. Contributions raise the author's score.
 
### 5.7 Joining a firm — MVP1
The advocate sends a request with title and office and the firm owner approves (or the owner invites by mobile or link). The advocate can leave on their own; the firm can remove at any time. An advocate can be in up to 5 firms. Firm lawyers are ordered by the owner with arrows, at firm level and at office level. The office head is shown first on the office page.
 
### 5.8 Premium on a custom domain — MVP1
- The owner points a CNAME (use `www`, or a host with CNAME flattening) to `{slug}.p.advocateid.in`. That address is hidden from search engines.
- Root-path links only. No link to advocateid.in except a small legal footer (disclaimer, report, terms, privacy).
- Search engines index the custom domain. advocateid.in/{slug} stays available inside AdvocateID (search, compare, bookmarks) as a Professional-style page, excluded from search engines. If the domain stops working, advocateid.in/{slug} keeps working.
- Personal: hero with link icons, highlights, courts, practice areas, timeline, case outcomes, offices, posts, optional "Member of".
- Firm: offices, lawyers, journey, case outcomes, highlights, links. Each lawyer has an in-domain page `/lawyers/{name}` built from the database (general info, same-firm colleagues, author and colleague posts). Membership approval is consent.
 
### 5.9 Contact and Connect — MVP1
One mobile number for WhatsApp and call, defaulting to the login number. A different number or an office number needs OTP. A number can be used on several pages of the same account only. The office page uses the office number, otherwise the page number. On phones a fixed Connect bar sits at the bottom of profile, firm and office pages and opens WhatsApp with: "Hello, I found your page {address}. I would like to speak with you." Premium uses its own domain in the text. The message follows the page language.
 
### 5.10 Lists and case summaries — MVP1
Every list (courts, practice areas, offices, lawyers, highlights, links, career entries) supports add, remove, edit and reordering with up/down arrows (drag on desktop). Case summaries sort by year and support add, edit, delete. Fields: role, court (search and select), year, outcome (Petition allowed, Petition dismissed, Partly allowed, Settled, Pending, Other), optional short note, optional link (own post or any reference; external links nofollow). The editor warns about promotional wording.
 
### 5.11 Compare — MVP1
Up to 3 advocates or firms, mixed allowed, with a remove button. Rows: type, experience, courts, practice areas, languages, career highlights, case outcomes, post count per category tag, offices and branches. No enrolment number, no verified mark, no ratings, no fees.
 
### 5.12 Language — MVP1 foundation
All text comes from translation files. The language is in the URL (`/ml/...`) with `hreflang` links; no automatic switching. Malayalam content starts with courts, locations, categories and court updates (`local_name`). UI text stays English until MVP 2. Choose a font that covers Malayalam script.
 
### 5.13 Link icons — MVP1
Known sites (LinkedIn, Facebook, Instagram, YouTube, X, Telegram) use their icon. Any other site uses its favicon, fetched automatically once and stored. A generic icon is the fallback.
 
### 5.14 Completeness — MVP1
A completeness percentage (owner-only) counts filled fields and feeds ranking. A page can be created with only the mandatory fields (advocate: name, slug, enrolment number, district).
 
---
 
## 6. Route map (MVP 1)
 
| Route | Description |
|---|---|
| `/` | Home |
| `/search?...` | Search with short-code filters (noindex) |
| `/c/{id}/{court-name-location-seo}` | Court page with tabs |
| `/c/{id}/{court-seo}/updates` | Court updates list |
| `/u/{id}/{seo}` | Court update article |
| `/l/{id}/{location-seo}` and `/l/{id}/{location-seo}/{practice-slug}` | Location and location + practice area |
| `/practice`, `/practice/{slug}` | Practice areas |
| `/post/{id}/{seo}` | Global post page |
| `/posts?author=&category=` | Author's posts in a category plus similar posts (noindex) |
| `/compare?a=&b=&c=` | Compare (noindex) |
| `/{slug}` | Advocate or firm page |
| `/{slug}/posts`, `/{slug}/offices`, `/{slug}/lawyers` | Tabs (lawyers on firm pages) |
| `/{slug}/o/{id}/{office-seo}` | Office page |
| `/login`, `/account`, `/account/bookmarks`, `/account/settings` | Account |
| `/manage/new`, `/manage/{pageId}` | Create page, live editor |
| `/manage/{pageId}/offices`, `/associates`, `/posts`, `/plan`, `/domain`, `/slug` | Page management |
| `/pricing`, `/about`, `/contact`, `/terms`, `/privacy`, `/grievance`, `/report` | Info |
| `/sitemap.xml`, `/sitemaps/{type}-{n}.xml`, `/robots.txt` | SEO |
| On a custom domain | `/`, `/posts`, `/p/{id}/{seo}`, `/offices`, `/o/{id}/{seo}`, `/lawyers`, `/lawyers/{name}`, `/contact`, `/sitemap.xml` |
 
Reserved words (cannot be slugs): c, l, u, post, posts, practice, compare, search, login, logout, account, manage, admin, api, pricing, about, contact, terms, privacy, grievance, report, sitemap, robots, lawyers, offices, ml.
Removed from MVP 1: `/i/...`, `/near-me`, analytics, billing, jobs.
 
---
 
## 7. Database design (normalised, built for search)
 
**Principles:** shared core tables for both page types; plan customisation in separate tables; type-specific facts in one-to-one extension tables; a denormalised search table for fast filtering; codes instead of long text in query strings; soft delete everywhere (`deleted_at`, `deleted_by`).
 
**Core**
- `accounts` (mobile, status)
- `pages` (id, account_id, type, slug, name, plan, status, district_id, lat, lng, bio 500, about 5000, language, photo_key, banner_key, completeness, score, created_at)
- `page_advocate` (page_id, enrolment_no unique, year_enrolled) · `page_firm` (page_id, established_year)
- `page_custom` (page_id, brand_colour, theme, toggles such as show_member_of) · `page_seo` (page_id, title, description, social image, alt texts)
- `domains` (page_id, hostname, status, cloudflare_id)
- `slug_history` (page_id, slug, from, to, reason)
 
**Content (one row per item, each with `sort`)**
- `page_courts`, `page_categories`, `page_languages`
- `career_entries`, `highlights` (number ≤3 digits, label ≤20), `page_links` (url, icon_key)
- `case_summaries` (page_id, court_id, role, year, outcome, note, link, post_id)
- `offices` (page_id, name, is_main, address, locality_id, lat, lng, phone, phone_verified, about, sort) and `office_courts`
- `memberships` (firm_page_id, advocate_page_id, title, office_id, status, firm_sort, office_sort, intro)
- `posts` (page_id, type article/court_update, title, body, court_id, source_url, language, status) and `post_categories`
- `reports` (target_type, target_id, reason, status)
 
**Reference data**
- `localities` (parent_id, level, code, name, local_name, lat, lng)
- `courts` (code, name, kind, locality_id, address, lat, lng) · `court_details` (court_id, sort, key_name, value) · `court_translations`
- `categories` (code, slug, names per language)
 
**Search and ranking**
- `search_index`: one row per page and per office with district, locality, category codes, court codes, language codes, years, type, lat/lng (bounding-box index), score, last_active. Rebuilt whenever a page changes. Text search via SQLite FTS5.
- `page_daily_events` (page_id, day, **host** (advocateid.in or custom domain), impressions, views, connects, shares) — counters only
- `page_scores` (page_id, quality, updated_at) — recalculated nightly
 
**Query rules:** keyset pagination, filters on codes, nearest search by bounding box then exact distance, cache public pages at the edge.
 
---
 
## 8. Images and PWA (MVP 1)
 
- The site is a PWA (installable; install prompt; service worker). Push notifications: MVP2.
- The browser resizes and compresses photos before upload (phone photos are large), making three sizes (for example 200, 800 and 1600 pixels wide) in WebP or JPEG.
- Uploads go to R2 through signed links; a background queue continues if the connection drops.
- The original is not kept. Images are served from R2 through the edge cache.
- Link icons (favicons) are fetched once and stored in R2.
 
---
 
## 9. Tracking and analytics (MVP 1 collects, MVP 2 shows)
 
- **Three events, counted separately:** *impression* (a page appears in a list, search result, similar block or post), *view* (the page is opened), *Connect tap*. Each is stored with the **host** (advocateid.in or the custom domain).
- **Every load is recorded** in the raw data. No bot or owner exclusion at recording time. Flags (owner, likely bot) are stored so ranking can ignore them.
- **Tools:** own counters in the database (ranking, admin) · Cloudflare's per-hostname analytics (traffic by domain) · Google Search Console (SEO). GA4 is optional later and needs a consent notice under DPDP. One tool set is enough; do not run both GA4 and Cloudflare analytics for the same purpose.
- Custom domains are served by our own application, so events on both sites are recorded by the same code.
- No visitor dashboard for owners in MVP 1. Admin sees totals. Owner dashboards arrive in MVP 2 once there is traction.
 
---
 
## 10. Ranking model (agreed)
 
`Score = 0.45 × Relevance + 0.25 × Nearness + 0.30 × Quality`
- **Relevance:** practice area 40 · court 25 · language 10 · text 15 · location name 10.
- **Nearness:** same locality 100 · city 75 · district 45 · state 15, or distance to the nearest office if the visitor shared a location.
- **Quality:** completeness 25 · content 25 (posts and court updates in 12 months, newer counts more, court updates extra) · engagement 20 (smoothed so zero visits is neutral, large numbers capped, compared with the same district and category) · experience 10 (capped at 25 years) · freshness 10 · new-profile boost 10 (fades to zero in 30 days).
- **Fairness:** for ranking, owner and bot loads are filtered out and one visitor counts once a day (every load is still recorded raw, Section 9); profiles within 5 points are shuffled daily; no firm takes more than 2 consecutive slots.
- **Arriving from a practice-area click:** the source page is first, with a small "You came from this page" mark.
- **Shown to visitors:** "Sorted by relevance", plus Nearest, Most experienced, Newest. The score and plan are never shown. No "top" or "best" labels.
 
---
 
## 11. MVP 1 requirements
 
| ID | Requirement |
|---|---|
| R01 | Home, search (district first), court updates, courts |
| R02 | Court page: tabs, filters, key-value table, sign-up banner, Connect cards |
| R03 | Back office: courts (CSV import once, then edit), court details, court updates via web form, categories, localities, reports, suspend page/post/update, slug actions |
| R05 | Location pages and practice-area pages, listing advocates, firms and offices |
| R06 | Search with short-code query filters, near me, experience |
| R07 | Compare up to 3 (advocates and firms), remove button |
| R08 | Compare tick on every advocate and firm card and page |
| R09 | Global post page, author and category posts page |
| R10 | Basic page shows nearby and similar advocates |
| R11 | Sitemaps (one per custom domain too), canonical rules, JSON-LD (Attorney, LegalService, GovernmentOrganization, Article, Breadcrumb) |
| R12 | Sticky mobile Connect bar |
| R20 | Mobile OTP login; dashboard (my pages with completeness, pending requests, bookmarks) |
| R21 | Up to 3 pages per mobile number; acting-as-page switcher |
| R22 | Create page with minimum fields (advocate: name, slug, enrolment number, district) |
| R23 | Join firm by request/invite, titles, offices; leave; ordering with arrows |
| R24 | Contact number with OTP; office numbers with OTP |
| R25 | Slug change once per 90 days, redirect for 12 months, admin recall |
| R30 | Live editor (side panel on desktop, bottom sheet on phones) |
| R31 | List editing (Section 5.10) |
| R32 | Highlights (4) and extra links (5, auto icons) |
| R33 | Case summaries with wording warning, court search, optional link |
| R34 | Page bio 500 / About 5,000; career timeline 5 or 10 |
| R35 | Profile picture and banner (banner not on Basic); R2 upload with PWA queue |
| R36 | Firm: lawyers section (photo, title, office, 200-character intro) |
| R37 | Office pages with own number, focus courts, local description, latitude/longitude |
| R38 | SEO fields for all plans |
| R39 | Posts and court-update posts with categories, optional court and source |
| R40 | Custom domain: connect, verify, certificate, root-path routing, white-label look, domain-lapse handling |
| R41 | Report an issue on pages, posts and updates (no login, captcha) |
| R42 | Event counters (impressions, views, Connect taps) per host; no owner dashboard |
| R43 | Ranking and sort options (Section 10) |
| R44 | Bookmarks (cookie, merged on login) |
| R45 | PWA install prompt |
| R46 | Data rights: download my data, correct, delete account (DPDP) |
| R47 | Consent and privacy notice wording; no tracking cookies without consent |
 
**MVP2:** payments and invoices · owner analytics dashboard (both hosts) · jobs · reviews ⚖️ · postal verification · Malayalam UI · push notifications · weekly summaries.
**MVP3:** star ratings ⚖️ · verified seal · bar associations · paid themes · Hindi and more languages · case status link · Postgres · matters ⚖️.
 
---
 
## 12. Legal and compliance (read with `AGENTS.md`)
 
- **DPDP Act 2023 and Rules 2025:** the Rules were notified on 13 Nov 2025; consent-manager rules start about Nov 2026 and the main duties (notice, consent, rights, breach reporting, security) about 13 May 2027, according to secondary sources. Counsel must confirm dates. The founder's decision is to comply strictly from day one.
- **Bar Council Rule 36:** advocates may not solicit work or advertise. A proviso allows limited information: name, enrolment, bar council membership, professional and academic qualifications, and area of practice. Platforms that listed advocates received notices in 2024, and the Madras High Court found the listing platforms could not claim IT Act safe harbour. A Supreme Court appeal by Sulekha was admitted; counsel must check its current status.
- **Consequence for this product:** profile fields beyond the permitted information (bio, highlights, case summaries, banner, links, posts, "top" style wording) are the riskiest parts. Counsel should review each field (T2) and we may need per-field switches. Until then: factual wording, no ratings, no "top" or "best" labels, no fee display, no matters or quotes.
- **IT Rules 2021:** grievance officer page, takedown process, terms that forbid unlawful content, published rules.
- Compliance rules for developers and for Claude Code live in `AGENTS.md` (draft supplied; T6 completes it).
 
---
 
## 13. Tasks and playbooks
 
| # | Task | Status |
|---|---|---|
| T0 | Keyword research playbook (English and Malayalam; "Advocate" vs "Lawyer"; Google Ads and Meta Ad Library) | **Pending**, after MVP 1 and its UI are final |
| T1 | Claude Design: create the style guide from the prompt file, then the pages | Next (prompt file supplied) |
| T2 | Counsel review, field by field against Bar Council rules: profile fields, competitor and similar blocks, global post page, case summaries, slug recall, terms ⚖️ | Open |
| T3 | Court seed CSV: name, local name, type, state, district, city, locality, address, pincode, latitude, longitude | Open |
| T4 | Payment gateway application (needs live pricing, terms, privacy, refund and contact pages) | MVP2 |
| T5 | Repo and Cloudflare access | Open |
| T6 | **Compliance research for `AGENTS.md`:** DPDP checklist, Bar Council and other law wording rules, banned phrases, consent and retention rules, vendor (processor) list. Output: finished `AGENTS.md` sections reviewed by counsel | Open |
| T7 | **Experiment:** `{slug}.p.advocateid.in` with Cloudflare for SaaS, CNAME vs apex domains, domains already behind another CDN, certificate timing, domain-lapse behaviour | Open |
| T8 | Claude Design to Claude Code handoff: test with one page before building all | Open |
 
---
 
## 14. Open questions for the next iteration
 
1. **Rule 36 and profile fields (T2).** Which fields stay on by default: bio, highlights, case summaries, banner, links, posts? Do we need per-field switches so a field can be hidden for lawyers without a code change?
2. **Ranking vs raw counts.** Raw data records every load, but ranking uses cleaned counts (owner and bot loads removed, one visitor per day). Confirm.
3. **Visitor privacy under DPDP.** Essential cookies only (no tracking cookies), visitors identified by a rotating random id, IP addresses not stored in full. Confirm, or do you want a consent banner for analytics?
4. **Premium before the domain is live.** advocateid.in/{slug} is indexed until the domain is active, then excluded. Confirm.
5. **Advocate consent on a firm's domain.** Membership approval is consent, and the advocate can leave. Also add a "hide me from the firm's domain" switch?
6. **Compare on offices.** I kept the compare tick on advocate and firm cards only. Do you also want it on office cards?
7. **`/posts` author parameter.** Use the page id (stable) or the slug (readable)?
8. **Enrolment number.** Format rules per state bar, and must one enrolment number belong to only one page?
9. **Court CSV.** Sign off the column list (T3) and the rules for locations that do not exist yet.
10. **"Write a court update" rights.** Available to Basic pages too? (Default: yes, all plans.)
11. **Lawyers or Advocates label.** Route is `/lawyers`; the visible label waits for T0.
12. **Case summary links.** Any URL allowed (nofollow), or block certain sites?
13. **Malayalam font.** Confirm a font that covers Malayalam (the current heading font does not).
14. **Payment pages.** Gateway review needs live pricing, terms, privacy, refund and contact pages. Who writes the refund wording?
 
