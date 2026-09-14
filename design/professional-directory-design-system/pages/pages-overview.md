# Pages overview

| Page | Route | Spec | Built in |
| --- | --- | --- | --- |
| Professional profile (3 tiers) | `/lawyer/{slug}` or tenant CNAME | professional-profile.md | Directory Profile Tiers |
| Homepage | `/` | homepage.md | Directory Pages §4 |
| Search results | `/{vertical}/{city}/{practice}` | search-results.md | Directory Pages §5 |
| Institution profile | `/court/{slug}` | institution-profile.md | Directory Pages §6 |
| City index | `/{city}` | city-index.md | Directory Pages §7 |
| Lawyer landing | `/lawyers` | lawyer-landing.md | Directory Pages §8 |
| CA landing | `/chartered-accountants` | ca-landing.md | — (template swap) |
| Tax landing | `/tax-experts` | tax-landing.md | — (template swap) |
| Pricing | `/pricing` | pricing.md | Directory Pages §9 |

## Shared page skeleton

```
Header  →  breadcrumb kicker  →  h1 block  →  [counts or facts strip]
        →  content sections divided by 2px rules
        →  index blocks (court / city / locality)   ← SEO surface
        →  unique prose block on the surface ground ← SEO body
        →  one accent field (CTA)
```

Every page keeps exactly one h1, opens each section with a kicker, and closes with a
single accent field. Not yet specified: dashboard (profile editor, analytics), onboarding
and claim-your-listing, job posts, article detail.
