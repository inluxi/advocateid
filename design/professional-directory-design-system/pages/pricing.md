# Pricing page

`/pricing` — three plans, monthly and yearly billing.

## Plans

| | Basic | Professional | Premium |
| --- | --- | --- | --- |
| Monthly | ₹0 | ₹999 | ₹1,999 |
| Yearly (per month) | ₹0 | ₹850 | ₹1,500 |
| Yearly total | — | ₹10,200 | ₹18,000 |
| Saving | — | ₹1,788 / yr (15%) | ₹5,988 / yr (25%) |

Prices exclusive of GST at 18%.

## Structure

```
[Header 64px]
[Kicker · h1 56px · intro                    │ Billing segmented control]
══ 2px rule
[3 plan cards — Professional inverted to ink as the anchor]
   kicker · name · ₹price · billing note · saving line
   ─── 2px ───
   feature list with tick / cross marks
   CTA button
[Comparison table — 14 rows, Professional column on surface tint]
[GST note]
[Questions — 4 FAQ cards, 2-col]
[Closing accent field]
```

Mobile stacks the three cards with the segmented control above them; the comparison
table is dropped (the per-card feature lists carry it) and three FAQs show.

## Behaviour

- The billing control is live: switching to yearly swaps both prices, both billing notes
  and both saving lines. It does not animate.
- Professional is the anchor: inverted card, "most chosen" kicker, filled CTA. Basic and
  Premium use outlined CTAs.
- Feature lists use ticks in `--color-text` and crosses in `ink-400` — absence is stated,
  not hidden, and greyed rows read at `#8A8686`.
