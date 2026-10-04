# API

All mutating endpoints require a same-origin request. Signed-in endpoints also need the `x-csrf-token` header (value from `GET /api/auth/me`). Errors are JSON `{ error, message?, ... }`; validation errors are `400 { error: "invalid_input", fields: [{ path, message }] }`; wording problems are `409 { error: "wording_flagged", flags }` (repeat with `acknowledgeWording: true` to save anyway); plan limits are `402`; rate limits `429`.

Auth: **public** = no login, **user** = session cookie (`aid_session`, HttpOnly, SameSite=Strict), **admin** = session of an admin account.

| Path | Methods | Auth | Rate limit (per IP) | Notes |
|---|---|---|---|---|
| `/api/account/delete` | POST | user |  | DPDP right to erasure: 30-day grace period (pages hidden at once), then everything is erased. |
| `/api/account/download` | GET | user |  | DPDP right to access: a JSON file with the account's own data. |
| `/api/admin/categories` | POST | admin |  |  |
| `/api/admin/courts/[id]` | GET,PUT | admin |  | Edit court fields and the key-value details table (court, order, key name, value). |
| `/api/admin/courts/import` | POST | admin |  | Admin: upload the all-India court CSV (text/csv body or multipart "file"). Validated first, then upserted by the id column. |
| `/api/admin/courts` | GET | admin |  |  |
| `/api/admin/grievances/[id]` | POST | admin |  |  |
| `/api/admin/localities` | POST | admin |  |  |
| `/api/admin/pages/[id]` | POST | admin |  | Admin actions on a page: assign plan (no payments in MVP 1), suspend/restore, recall slug. |
| `/api/admin/posts/[id]` | POST | admin |  |  |
| `/api/admin/reports/[id]` | POST | admin |  |  |
| `/api/admin/updates` | POST | admin |  | Official court update written in the back-office web form (no CSV). |
| `/api/auth/acting` | POST | user |  | A login is an account, not a person: choose which page acts (posts, court additions, requests). |
| `/api/auth/logout` | POST | public |  |  |
| `/api/auth/me` | GET | public |  |  |
| `/api/auth/otp/send` | POST | public | 3/15min | Never reveals whether a number already has an account. 3 requests per 15 minutes per IP and per mobile. |
| `/api/auth/otp/verify` | POST | public | 15/15min |  |
| `/api/bookmarks` | GET,POST | public |  | Cookie for visitors, database after login (merged at login). |
| `/api/captcha` | GET | public |  |  |
| `/api/compare` | GET,POST | public |  | Up to 3 advocates or firms, mixed allowed. Essential cookie, session-length. |
| `/api/contact` | POST | public | 5/60min | Contact page, also used to request a missing court (kind = court_request). Kept 90 days. |
| `/api/courts` | GET | public | 120/1min | Court search for the selectors (the court list is admin-seeded; users cannot add courts). |
| `/api/dev/otp` | GET | public |  | End-to-end test hook: returns the last OTP the dev SMS adapter "sent". Exists only when E2E=1 and never in production. |
| `/api/directory` | GET | public | 60/1min | Public name search over active pages (used to find a firm to join or an advocate to invite). Public data only. |
| `/api/favicon/[host]` | GET | public |  | Link icon for sites without a known icon: the favicon is fetched once, stored and served from our storage. |
| `/api/grievance` | POST | public | 5/60min |  |
| `/api/health` | GET | public |  |  |
| `/api/jobs/nightly` | POST | public |  |  |
| `/api/localities` | GET | public | 120/1min |  |
| `/api/memberships/[id]/move` | POST | user |  | Order lawyers with arrows, at firm level or office level. |
| `/api/memberships/[id]` | PUT,POST | user |  | Which side of the membership is the signed-in account (null if neither). |
| `/api/memberships` | POST | user | 20/60min | An advocate page asks to join a firm (acting as that page). |
| `/api/pages/[id]/contact` | POST | user | 10/15min | The Connect number defaults to the login number. A different number needs an OTP (not used for login). |
| `/api/pages/[id]/contact/verify` | POST | user | 20/15min |  |
| `/api/pages/[id]/domain` | GET,POST,DELETE | user | 20/60min |  |
| `/api/pages/[id]/domain/verify` | POST | user | 30/60min |  |
| `/api/pages/[id]/images` | POST | user | 60/60min | * Background upload target. The browser has already resized the picture to three sizes (s=200, m=800, l=1600 px wide, WebP or JPEG), so the server never receives or keeps |
| `/api/pages/[id]/invites` | POST | user | 20/60min |  |
| `/api/pages/[id]/lists/[list]/[itemId]/move` | POST | user |  | Up/down arrows (drag on desktop calls this repeatedly). |
| `/api/pages/[id]/lists/[list]/[itemId]` | PUT,DELETE | user |  |  |
| `/api/pages/[id]/lists/[list]` | POST | user |  | Add an item to a list (courts, categories, languages, career, highlights, links, cases, offices). Limits come from the entitlement module. |
| `/api/pages/[id]/offices/[officeId]/main` | POST | user |  |  |
| `/api/pages/[id]/offices/[officeId]/phone` | POST | user | 10/15min |  |
| `/api/pages/[id]/offices/[officeId]/phone/verify` | POST | user | 20/15min |  |
| `/api/pages/[id]/posts` | GET,POST | user | 30/60min | type=article (default) or type=court_update. Court updates are published at once and credited to the page. |
| `/api/pages/[id]` | GET,PUT,DELETE | user |  |  |
| `/api/pages/[id]/slug` | POST | user |  | One change every 90 days. The old address redirects for 12 months. |
| `/api/pages` | POST | user | 10/60min | Create a page with the minimum fields (advocate: name, slug, enrolment number, district). Max 3 per account. |
| `/api/posts/[id]` | GET,PUT,DELETE | user |  | Soft delete (owner). |
| `/api/report` | POST | public | 5/15min | Anyone can report a page, post or update without logging in (captcha + rate limit). |
| `/api/slug/check` | GET | public | 60/1min |  |
| `/connect/[pageId]` | GET | public |  | * Connect: records the tap (per host) and redirects to WhatsApp or the phone dialler. The number is never put in a page URL or in our own links (DPDP: no mobile numbers i |
| `/sitemap.xml` | GET | public |  | Index of all sitemaps (static, courts, profiles, offices, posts). Cached at the edge for an hour. |
| `/sitemaps/[file]` | GET | public |  |  |
| `/sites/[host]/robots.txt` | GET | public |  |  |
| `/sites/[host]/sitemap.xml` | GET | public |  | Per-domain sitemap: only this site's own root-path pages. A lapsed domain drops out (404). |
| `/uploads/[...path]` | GET | public |  | Development image server (STORAGE_PROVIDER=local). In production images are served from the storage bucket. |

## Request bodies

Defined with zod in `src/lib/schemas.ts` (single source of truth):

- `POST /api/auth/otp/send` `{ mobile, consent: true }` then `POST /api/auth/otp/verify` `{ mobile, otp }`. OTP: 6 digits, valid 10 minutes, 3 wrong attempts lock it, 3 sends per 15 minutes per IP and per mobile.
- `POST /api/pages` `{ type: "advocate"|"firm", name, slug, districtId, enrolmentNo (advocate) }`.
- `PUT /api/pages/{id}` any of `name, bio (500), about (5000), districtId, language, enrolmentNo, yearEnrolled, establishedYear, brandColour, showMemberOf, allowMembers, seoTitle, seoDescription, photoAlt, bannerAlt`.
- `POST|PUT|DELETE /api/pages/{id}/lists/{list}[/{itemId}]` with list one of `courts, categories, languages, career, highlights, links, cases, offices`; `POST .../{itemId}/move { direction }`. Limits come from `src/lib/entitlements.ts`.
- `POST /api/pages/{id}/images` multipart `kind` (photo|banner|office|cover) plus `s`, `m`, `l` (the browser resizes to 200, 800 and 1600 px wide).
- `POST /api/pages/{id}/posts[?type=court_update]`, `PUT|DELETE /api/posts/{id}`.
- `POST /api/memberships` (request to join), `POST /api/pages/{id}/invites`, `PUT /api/memberships/{id}` (title, office, intro), `POST /api/memberships/{id}` `{ action: approve|reject|leave|remove|hide|show }`, `POST /api/memberships/{id}/move`.
- `POST /api/pages/{id}/domain { hostname }`, `POST .../domain/verify`, `DELETE .../domain`.
- Public forms (`/api/report`, `/api/grievance`, `/api/contact`) need `captchaToken` and `captchaAnswer` from `GET /api/captcha`.

## Non-API routes with side effects

- `GET /connect/{pageId}?via=whatsapp|call[&office={id}]` records a Connect tap (per host) and redirects to WhatsApp (message: "Hello, I found your page {address}. I would like to speak with you.") or `tel:`. The mobile number never appears in a page URL.
- `GET /sitemap.xml`, `/sitemaps/{static|courts|profiles|offices|posts}-{n}.xml`, `/robots.txt` (and per-domain versions on custom hosts).
- `GET /uploads/...` serves images when `STORAGE_PROVIDER=local`.
