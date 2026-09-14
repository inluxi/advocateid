# Responsive rules

Mobile-first: design at 375, scale to 768, then 1200. Named steps, not fluid clamps —
the modular grid depends on predictable values.

## Breakpoints

| Name | Width | Layout |
| --- | --- | --- |
| mobile | 375px | Single column, stacked, sticky contact bar |
| tablet | 768px | 2-column grids, sidebars collapse above content |
| desktop | 1200px | Multi-column with sidebars, 1200px container |
| wide | 1600px | Container stays 1200px, gutters grow |

## Type scaling

| Role | 375 | 768 | 1200 |
| --- | --- | --- | --- |
| Masthead | 36px | 56px | 78px |
| h1 | 30px | 44px | 56px |
| h2 | 24px | 32px | 38px |
| h3 / card title | 15px | 16px | 16px |
| Body | 14px | 14px | 15px |
| Small | 13px | 13px | 13px |
| Kicker | 10px | 10px | 10px |

## Spacing scaling

| Role | 375 | 768 | 1200 |
| --- | --- | --- | --- |
| Content padding | 18px | 24px | 36px |
| Section spacing | 20px | 24px | 26px |
| Grid gap | 10px | 14px | 16px |
| Card padding | 14px | 16px | 18–20px |

## Layout changes

- **Portrait**: full width at 375 → 50% at 768 → fixed 420–440px column at 1200.
  The 4:5 ratio never changes.
- **Sidebars** (filter rail, profile sidebar): stacked above the content on mobile as
  collapsible sections; fixed column with a 2px separating rule at desktop.
- **Tabs**: horizontally scrollable at 375, full row at 768+.
- **Contact actions**: sticky bottom bar at 375, inline action bar at 768+.
- **Comparison table**: dropped below 768; per-card feature lists carry it.

## Touch targets

Buttons 44px minimum on mobile, 48px for primary actions; icons 24px; tab targets
44px tall. Never place two 44px targets closer than 8px.

## Performance

- Lazy-load below the fold; the hero portrait is eager with `fetchpriority="high"`.
- Server-render the index blocks and prose — they are the SEO surface.
- The pages work without JavaScript except the tab bar, filter rail and pricing toggle;
  render the default tab's content server-side so a no-JS visitor sees the overview.
- Budget for 3G: hero portrait ≤ 120KB, page ≤ 400KB.
