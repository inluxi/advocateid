# AGENTS.md: rules for anyone (human or AI) working on advocateid.in

*Status: ACTIVE. Detailed rules live in `/rules/` folder. This file states the principles and references specific guidance. Read `PROJECT_REQUIREMENTS_v6.md` and `MVP1-INSTRUCTIONS.md` first. Not legal advice.*

---

## 1. What this project is

An SEO-first public directory of advocates and law firms in India, organised by courts, locations and practice areas. Next.js on Cloudflare Workers, Cloudflare D1 (Postgres later) through Drizzle ORM, R2 for images, Cloudflare for SaaS for custom domains. Deploy with wrangler; `main` = production, `staging` = preview.

---

## 2. Non-negotiable: DPDP Act 2023 and DPDP Rules 2025

The founder's rule: **comply strictly from day one.** The Rules were notified 13 Nov 2025; main duties commence ~13 May 2027. We comply now. **See `/rules/dpdp-checklist.md` for the full implementation checklist.**

**In brief:**
- Personal data includes: mobile numbers, OTP logs, names, photos, enrolment numbers, addresses, job and contact details, IP addresses, device ids, visitor ids, bookmarks.
- Notice and consent required before collecting (specific, free, withdrawable; no bundled consent).
- Collect only what a feature needs; do not reuse without new consent.
- Visitors: essential cookies only (session, bookmarks, compare); no advertising or cross-site tracking; analytics use rotating random id, never full IP or raw mobile.
- Children: no features that track or target under-18.
- Rights: download, correct, delete data; grievance route `/grievance`.
- Retention: every table holding personal data has a documented purge job.
- Security: encrypt in transit, secrets in Cloudflare secrets, hash OTPs, rate-limit OTP endpoints, audit log for admin.
- Breach: report immediately to founder; breach process exists before launch.
- Processors: list every vendor (Cloudflare, SMS, R2, email) with location and contract.
- No logging of personal data to console, error trackers or analytics; no mobile numbers in URLs.

**Counsel review required (T6):** confirm phase dates and all obligations.

---

## 3. Bar Council and wording rules (user-facing text and data)

Advocates may not solicit work or advertise (Rule 36, Part VI, Chapter II, BCI Rules). A proviso allows: name, enrolment, bar council membership, professional and academic qualification, area of practice. Listing platforms received notices in 2024.

**See `/rules/bar-council-wording.md` for:**
- Banned phrases (best, top, leading, expert, guaranteed, testimonials, ratings, fees, case photos)
- Allowed style (plain facts: "Represented petitioner. Family Court, Ernakulam, 2023. Outcome: petition allowed.")
- Field-by-field review (which fields are risky; which need switches)
- Wording examples for each field

**In code:**
- Ranking must never use the paid plan and must never be displayed.
- No reviews, ratings, matters or quotes until counsel clears them.
- Sorted by relevance, nearest, most experienced, newest only.
- The main action is **Connect** (WhatsApp). No "hire" or "book" buttons.

---

## 4. Product rules the code must respect

- One mobile login = one account; max **3 pages** per account (advocate and firm). Users act "as" one of their pages.
- Slug: 5 to 30 chars, a-z, digits, hyphen; global; reserved words list in requirements; change once per 90 days; old slug redirects 12 months; deleted slug reserved 90 days; admin may suspend, cancel or recall.
- Enrolment number is mandatory for an advocate page, shown "as declared", hidden on compare. No Verified seal.
- Plan limits (courts, practice areas, career, case summaries, offices, lawyers, banner, highlights, links) are enforced in **one entitlement module**, never scattered in components. On downgrade keep the first N items in the owner's order and hide the rest; never delete.
- Premium on a custom domain: root-path links only; no link to advocateid.in except small legal footer; canonical = custom domain; `{slug}.p.advocateid.in` is noindex.
- Court list is seeded by admin CSV import; users cannot add courts.
- Every list has `sort`; every table has `deleted_at`, `deleted_by`.
- Events: store impressions, views and Connect taps per host; raw data records every load with owner/bot flags; ranking uses cleaned counts.

---

## 5. SEO rules

**See `/rules/seo.md` and `/rules/schema.md` for:**
- Indexable pages (district, district + practice area, court, court + practice area, location, location + practice area, profiles, offices, posts, court updates)
- Noindex pages (filters, sort, `first=`, compare, beyond page 5) with canonical to base
- `/{id}/{seo}` routing: `{id}` decides; wrong `{seo}` redirects 301
- Language in URL (`/ml/...`) with `hreflang`; never auto-switch
- JSON-LD (Attorney, LegalService, GovernmentOrganization, Article, BreadcrumbList)
- "My page first" hack for practice-area clicks
- Locale hacks for Malayalam rendering

---

## 6. Code conventions

- TypeScript, Next.js App Router, Drizzle ORM. **No SQL outside the repository layer.** Keep schemas Postgres-portable.
- Search: one `search_index` table, bounding-box then exact distance, keyset pagination. Codes (2–6 lowercase chars) for districts, courts, practice areas and locations in query strings.
- All UI text from translation files; no hard-coded strings. Fonts must support Latin and Malayalam.
- Accessibility: WCAG AA contrast, visible focus, keyboard reachable, reduced motion.
- Images: resized in the browser, uploaded in the background, three sizes, originals not kept.

**See `/rules/git.md` for:**
- Commit conventions (small, logical, no secrets, no real personal data in fixtures)
- Code review checklist
- Before-push checklist

---

## 7. Analytics and tracking

**See `/rules/analytics.md` for:**
- Event recording (impression, view, Connect tap) per host
- Raw data rules (every load recorded; bot/owner flags stored; ranking filters them out)
- DPDP consent for analytics tools
- Rotating random visitor IDs
- IP address handling (never stored in full)
- Tools: own counters (ranking, admin) · Cloudflare per-hostname · Google Search Console. GA4 only later with consent.

---

## 8. Before you finish any task

1. **Personal data?** Re-read section 2 and `/rules/dpdp-checklist.md`. Does any visitor data flow through this feature?
2. **User-facing wording?** Run `/rules/bar-council-wording.md` banned-word check. Any promotional language?
3. **Plan limits?** Are they enforced in the entitlement module, not scattered?
4. **Route changed?** Update the route table in `PROJECT_REQUIREMENTS_v6.md` and sitemap rules in `/rules/seo.md`.
5. **Analytics event?** Is it recorded per host with correct flags?
6. **SEO?** Canonical correct? Noindex applied? JSON-LD schema valid?
7. **Tests, lint, build pass.** Note blockers in the pull request.

---

## 9. Repository structure

```
/src/
  helm-charts/
    infra/          — Cloudflare infrastructure
    app/            — Application deployment
  app/              — Next.js application code
/rules/             — Detailed governance
  schema.md
  seo.md
  bar-council-wording.md
  dpdp-checklist.md
  analytics.md
  git.md
/design/            — Read-only: Claude Design prototype and HTMLs
/docs/
  MVP1-INSTRUCTIONS.md
  PREREQUISITES.md
  PROJECT_REQUIREMENTS_v6.md
```

---

## 10. Compliance ownership

- **All changes:** the developer/AI must check sections 2, 3, 5, 7 of this file.
- **Field edits (bio, highlights, case summaries, banner, links, posts):** run `/rules/bar-council-wording.md`.
- **New table or data flow:** confirm with `/rules/dpdp-checklist.md`.
- **New route or canonical change:** update `/rules/seo.md`.
- **Unsure about anything:** ask in the PR. This is a new product with legal risk; clarity is worth the time.

---

## Status and phasing

- **MVP 1** (this release): core directory, search, posts, custom domains, DPDP compliance, Bar Council wording rules.
- **MVP 2:** payments, owner analytics, jobs, reviews (counsel review), postal verification, Malayalam UI, push notifications.
- **MVP 3:** star ratings (counsel review), verified seal, bar associations, paid themes, Postgres, matters (counsel review).

**Open counsel review (T2, T6):** field-by-field risk, DPDP timeline, Bar Council current status (Sulekha appeal), Madras High Court ruling on safe harbour.
