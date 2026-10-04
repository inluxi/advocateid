## What changed

<!-- Short description. Link the section of MVP1-INSTRUCTIONS.md or the requirement ID (R..) -->

## Compliance checklist (AGENTS.md section 8)

- [ ] **Personal data**: no mobile numbers, OTPs, names, IPs or tokens in logs, URLs, errors or analytics; new table or data flow added to `/rules/dpdp-checklist.md` with a retention period and purge job
- [ ] **Wording**: user-facing text passes the `/rules/bar-council-wording.md` check (no best, top, leading, expert, guaranteed, won, hire, book, ratings, reviews, fees)
- [ ] **Plan limits** live only in `src/webapp/lib/entitlements.ts`
- [ ] **Routes**: route table and sitemap rules updated in `/rules/seo.md` (and the requirements route map) if a route or canonical changed
- [ ] **Analytics**: events recorded per host with owner and bot flags
- [ ] **SEO**: canonical, noindex and hreflang correct; JSON-LD valid
- [ ] **Security**: input validated (zod), CSRF and rate limits on mutating public endpoints, no secrets in the diff

## Checks

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] E2E (`npm run test:e2e`) if auth, pages, or routing changed

## Notes for reviewers / blockers
