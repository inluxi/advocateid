# advocateid.in

SEO-first directory of advocates and law firms in India, organised by courts, locations and practice areas.
MVP 1: OTP login, advocate and firm pages, search, court and location pages, posts and court updates,
Premium custom domains, event counters, DPDP and Bar Council compliance rules.

Read `AGENTS.md` (rules), `MVP1-INSTRUCTIONS.md` (roadmap) and `NOTES.md` (what was built, assumptions and open gaps) first.

## Stack

Next.js 16 (App Router, `proxy.ts`), TypeScript, Drizzle ORM on PostgreSQL, Docker, Helm (k3s), ArgoCD, GitHub Actions.
Images go through a storage adapter (`local` for development, `firebase` for production). OTP SMS goes through an adapter (`msg91`).

```
src/app/            routes (App Router): (site) public pages, sites/[host] Premium domain tree, admin, api
src/components/     UI (server components by default; client components only for forms and editors)
src/db/             Drizzle schema, migrations, seeds, client
src/repo/           repository layer: ALL database access lives here
src/lib/            pure rules and helpers: entitlements, wording, ranking, slug, seo, i18n, session, api wrapper
src/messages/       translation files (all UI text); English now, Malayalam keys fall back to English
src/jobs/           nightly job
src/helm-charts/    app chart (Deployment, Service, Ingress, HPA, nightly CronJob) and infra chart (ClusterIssuer, ArgoCD apps)
rules/              detailed governance (DPDP, Bar Council wording, SEO, analytics, git)
e2e/                end-to-end API tests against a running server
design/             read-only prototype and mockups
```

## Run locally

Needs Node 22 and PostgreSQL 15+.

```bash
cp .env.example .env              # set DATABASE_URL, APP_SECRET (32+ chars)
npm install
npm run db:migrate                # applies src/db/migrations
npm run db:seed -- --demo         # districts, categories, courts and made-up sample pages
npm run dev                       # http://localhost:3000
```

In development the SMS adapter prints the OTP to the server console (never in production). Make yourself an admin
by listing your mobile in `ADMIN_MOBILES` (E.164, e.g. `+919000000001`) before you first log in, then open `/admin`.

### Scripts

| Script | Purpose |
|---|---|
| `npm run lint` / `typecheck` / `test` / `build` | the four checks CI runs (`test` uses PGlite, no database needed) |
| `npm run test:e2e` | API flows against a running server: `E2E=1 npm run dev`, then `E2E_BASE_URL=http://localhost:3000 npm run test:e2e` |
| `npm run db:generate` | create a migration after changing `src/db/schema.ts` |
| `npm run db:migrate` / `db:seed` | apply migrations / seed reference data (`-- --demo` adds sample pages) |
| `npm run job:nightly` | rollups, scoring, search index rebuild, DPDP purges, domain re-check |

### Testing custom domains locally

Premium pages are served from the internal `/sites/{host}` tree. Add a row to `domains` with `status = 'active'` for a
Premium page and call the app with that Host header (`curl -H "Host: www.example.com" localhost:3000/`).
`{slug}.p.advocateid.in` hosts are served too (always noindex).

## Environment

See `.env.example`. Secrets (`DATABASE_URL`, `APP_SECRET`, `MSG91_*`, `FIREBASE_SERVICE_ACCOUNT`, `JOB_TOKEN`) are
Kubernetes Secrets, never in Git. `APP_SECRET` is used to hash mobiles and IPs for lookups and to sign tokens.

## Deploy

1. One-time cluster setup: `src/helm-charts/infra/README.md` (ingress-nginx, cert-manager, ArgoCD, ClusterIssuer).
2. Create the Kubernetes Secrets (see comments in `src/helm-charts/app/values.yaml`).
3. Add the GitHub secrets `DOCKER_USERNAME` and `DOCKER_PASSWORD`.
4. Push to `staging` (preview) or `main` (production). `.github/workflows/deploy.yml` lints, tests, builds and pushes the image,
   writes the new tag into `src/helm-charts/app/values-{env}.yaml`, and ArgoCD rolls it out. Migrations run in an init container.
5. The nightly CronJob runs `npm run job:nightly` (02:00 IST).

Rollback: revert the values commit (or `argocd app rollback`); migrations are forward-only, so write additive migrations.

## Monitoring

`/api/health` (readiness and liveness), JSON logs on stdout without personal data (`src/lib/logger.ts`),
the admin dashboard (`/admin`: impressions, views and Connect taps per host, open reports and grievances, audit log).
Sentry and Cloudflare analytics are not wired in code (see NOTES.md).

## API

Routes, request and response shapes: `docs/API.md`. Database tables: `docs/SCHEMA.md`.

## Compliance

DPDP and Bar Council rules are enforced in code, not only in documents:
OTPs and sessions are stored as hashes, rate limits on OTP, report, grievance and contact endpoints, no mobile numbers in URLs or logs,
rotating visitor id, essential cookies only, retention purges in the nightly job, data download and deletion with a 30-day grace period,
live wording check (client and server) with an audit trail of flagged saves, plan limits in one module, no ranking by plan.
Counsel sign-off (T2, T6) is still required before launch.
