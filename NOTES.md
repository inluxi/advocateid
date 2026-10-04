# Build notes: MVP 1

What was built from `MVP1-INSTRUCTIONS.md`, the decisions taken where the documents disagree or are silent, and the gaps left for a human.
Everything here was built unattended; items marked **GAP** need your attention before launch.

## Status against the roadmap

| Area (MVP1-INSTRUCTIONS) | State |
|---|---|
| 1.0 to 1.2 VPS, k3s, Helm infra, DNS | Not code. `src/helm-charts/infra` (ClusterIssuer, ArgoCD applications) and its README have the commands. **GAP**: not applied to a cluster |
| 1.3 Database | Done: Drizzle schema for all tables, migration `0000_init`, indexes, soft delete, seeds (`src/db/seed*.ts`). No foreign keys by design |
| 1.4 Docker, CI/CD | Done: `Dockerfile`, `.github/workflows/{ci,deploy}.yml`. **GAP**: not built in this sandbox (no Docker daemon) |
| 1.5 Helm app chart, ArgoCD | Done: `src/helm-charts/app` (Deployment with migration init container, Service, Ingress, HPA, nightly CronJob). **GAP**: `helm lint` was not run (no helm binary reachable) |
| Auth (OTP, sessions, consent) | Done and covered by tests |
| Court seeding (CSV import, edit) | Done: `/api/admin/courts/import`, `/admin/courts` |
| Page creation and live editor | Done: all tabs except "Brand" being inside the profile form. Photo/banner resized in the browser, background upload queue (IndexedDB) |
| Profile pages (Basic / Professional / Premium) | Done: three layouts, tabs as routes, Connect bar, compare, bookmarks, JSON-LD |
| Search, court, location, practice pages | Done: ranking per section 10, keyset pagination, near me (cookie), thin-page noindex |
| Posts, court updates, reports | Done |
| Custom domains and Premium layout | Done in the app (host routing, canonical rules, domain sitemap and robots, lapse fallback). **GAP**: certificates for customer domains (T7) |
| Sitemaps, robots, JSON-LD | Done |
| Analytics events | Done: impressions, views, Connect taps per host with owner/bot flags, nightly rollup, purges, admin totals |
| DPDP and Bar Council | Done in code (see AGENTS.md section 2 and 3). **GAP**: counsel sign-off (T2, T6), real legal text |
| Tests | 88 unit/repository tests (PGlite), 12 end-to-end API tests. **GAP**: no browser E2E (Playwright) suite, no coverage report, no load test |
| Sentry, Cloudflare analytics, Lighthouse | **GAP**: not wired / not measured |

## Decisions where documents disagree

1. **Stack.** `AGENTS.md` and requirements v6 say Cloudflare Workers, D1, R2. `MVP1-INSTRUCTIONS.md` (updated stack) says k3s, Helm, ArgoCD, Render PostgreSQL, Firebase Storage. I followed `MVP1-INSTRUCTIONS.md`. Storage is an adapter (`src/lib/storage.ts`): `local` and `firebase` (GCS bucket). R2 is not implemented. Please update `AGENTS.md` sections 1 and 8 and the "Cloudflare secrets" wording in `/rules` when you confirm the stack.
2. **Repository layout.** `AGENTS.md` shows `/src/app` for code and `/src/helm-charts`; the app source is therefore at the repo root (`src/app`, `src/db`, ...) with Helm under `src/helm-charts`. `PROJECT_REQUIREMENTS_v6.md` is not in the repo any more (deleted in commit `494f1a1`); I read it from history (`git show 494f1a1^:design/PROJECT_REQUIREMENTS_v6.md`). Consider restoring it.
3. **Readable paths.** `seo.md` mixes `/d/{code}/{cat}/{code}` and `/d/{code}/practice-area/{catcode}`. Implemented: `/d/{district}/practice-area/{practice-slug}`, `/c/{id}/{seo}/{practice-slug}`, `/l/{id}/{seo}/{practice-slug}` (codes are accepted too). Updated in `rules/seo.md`.
4. **Highlights.** Rules say both "dropdown suggests labels" and "locked format, no free text". Enforced the locked list server-side (`HIGHLIGHT_LABELS` in `src/lib/outcomes.ts`).
5. **Lawyers on Basic firms.** The matrix says Basic firms cannot approve lawyers but may list 1. Implemented: any firm can *invite* (the advocate's acceptance is consent); advocates can only *request* to join firms on Professional or Premium.
6. **Grievance contact.** The schema list says `contact_hash`; a hash cannot be replied to, so the contact is stored as text (purged 3 years after resolution).
7. **Impressions in the daily table.** The analytics rule rolls raw impressions into `impressions`; I store cleaned and raw counts side by side (`impressions` / `raw_impressions` etc.). Views count one visitor once a day.

## Behaviour worth knowing

- Plan limits live only in `src/lib/entitlements.ts`. Downgrade hides items beyond N (public view and search index) and keeps them; the editor shows them greyed.
- Ranking: `0.45 relevance + 0.25 nearness + 0.30 quality` in `src/lib/ranking.ts`, quality recomputed on every page change and nightly. Plan is never an input (test: `plan never changes ranking quality inputs`). Candidates are capped at 1,000 per query and ranked in memory; pagination is a keyset cursor over that ranked list. Ties within 5 points are shuffled with a daily seed; no page takes more than 2 consecutive slots.
- Search index: delimited text columns plus LIKE (portable), one row per page and per office with a description. District is required for `/search`; court pages search without a district.
- Near me: the browser position is rounded to ~1 km, kept in a session cookie (`aid_near`) and never put in the URL or the database.
- Language: `/ml/...` is rewritten by `src/proxy.ts` to the same route with `x-lang=ml`; never automatic. Malayalam UI strings are mostly missing (falls back to English, as agreed); court, locality and practice-area names are localised.
- Slug rules: 5 to 30 chars, reserved list in `src/lib/slug.ts` (includes `sites` and `connect`), one change per 90 days, old slug redirects 12 months (308), deleted/recalled slugs reserved 90 days. App Router pages cannot return 410, so reserved addresses return 404.
- Redirects for a wrong `{seo}` are 308 (Next's permanent redirect), not 301.
- Premium: on advocateid.in it renders as Professional; with an active domain advocateid.in/{slug} is `noindex` with a canonical to the domain and drops out of the sitemap. If DNS stops pointing to us the nightly job marks the domain `lapsed` and the page is indexable again. The hidden target `{slug}.p.advocateid.in` is served but `noindex`.
- Custom-domain pages use root-path links only; the legal footer links (terms, privacy, report) are the only links to advocateid.in. The root layout still ships the PWA manifest and "AdvocateID" apple-web-app title on white-label domains (minor branding leak).
- Connect: links go to `/connect/{id}` which records the tap per host and redirects to WhatsApp/`tel:`; the number never appears in HTML or our URLs.
- Events: every page load records a raw event after the response (`after()`), with `is_owner` and `is_bot`. Pages are rendered dynamically (no edge HTML cache), so counts are exact; add edge caching later together with a beacon-based counter.
- Rate limiting is database-backed (shared across pods) and keyed by a hash of the client IP from `X-Forwarded-For`; if you put Cloudflare in front, switch `clientKey` in `src/lib/api.ts` to `CF-Connecting-IP`.
- Admin: an account becomes admin when its mobile is in `ADMIN_MOBILES` at first login (or set `accounts.role = 'admin'`). Plan assignment, suspension, slug recall, court CSV, official court updates, reports, grievances, categories and places are in `/admin`.

## Not done / open (please review)

- **GAP** Real SMS provider: `msg91` adapter written but untested (needs a DLT-approved template). Firebase Storage adapter and Cloudflare custom-hostname call are untested.
- **GAP** Content Security Policy header (needs nonces with Next); HSTS and other security headers are set in `next.config.mjs`.
- **GAP** Court seed CSV (T3) is a 15-court sample; district codes are our own (`ekm`, `tvm`, ...). Import validates and auto-creates missing localities, creating a missing district named after the city.
- **GAP** Legal pages (terms, privacy, about) are placeholders for counsel. Grievance officer name/email come from `GRIEVANCE_OFFICER_NAME` and `GRIEVANCE_OFFICER_EMAIL`.
- **GAP** Enrolment number format and uniqueness are not enforced (open question 8); it is "as declared".
- **GAP** Design: the UI is the prototype v2 look (ink navy, seal maroon, brass) with Noto fonts (Latin plus Malayalam, self-hosted via Fontsource). Claude Design output (T1/T8) has not been applied.
- **GAP** Postal address verification, owner analytics, jobs, reviews, push notifications are MVP 2 and not started.
- Lighthouse, Core Web Vitals and load tests were not run. No Playwright suite.
- Dev-only hook `GET /api/dev/otp` exists for E2E tests; it returns 404 unless `E2E=1` and `NODE_ENV != production`.
- `next dev` tries to append a block to `AGENTS.md`; disabled with `agentRules: false` in `next.config.mjs`.
