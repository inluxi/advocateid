# Professional Directory SaaS — Design System v1.0

Exported 2026-09-14. This package describes the design as actually built in the approved
mockups (nine screens: profile tiers, homepage, search, institution, city index, lawyer
landing, pricing), not a generic starter kit.

## What is in here

| Path | What it is |
| --- | --- |
| `design-tokens.json` | Every colour, type step, spacing unit, shadow and breakpoint. The machine-readable source. |
| `tailwind.config.js` | The same tokens pre-wired for Tailwind. Optional. |
| `components/` | Six component specs plus an overview: button, card, badge, hero, form, navigation. |
| `pages/` | Layout specs for every page in the mockups, mobile and desktop. |
| `specifications/` | Responsive rules, image specs, colour customization, tier variants, typography, spacing. |
| `assets/` | Palette sheet and screenshots of the built screens. |
| `DESIGN-HANDOFF-README.md` | Read this first if you are the implementing engineer. |

## The five rules that matter most

1. **Zero corner radius.** Everywhere. No exceptions, including tags, avatars and inputs.
2. **Archivo only**, weights 400/500/600/700/800. Headings are 800 with negative tracking.
3. **Flush left**, always — headings, copy, and labels inside wide buttons.
4. **2px rules divide sections**, 1px hairlines divide rows inside a section.
5. **Portraits are 4:5 on white**, at every breakpoint.

## Stack notes

Written for React on Node/PostgreSQL/Firebase. Tokens are plain JSON with no build
dependency; the Tailwind config is a convenience, not a requirement. Tenant colour
arrives as two CSS variables (`--brand`, `--brand-ink`) set on the page root from the
tenant record — see `specifications/color-customization.md`.

## Deviation notice

The original brief specified Inter, 4–16px radii and amber stars. The bound design system
(Modernist) mandates Archivo, zero radius and accent-coloured stars, and the approved
mockups follow it. `specifications/deviations-from-brief.md` lists every such divergence
with the reasoning, so nothing is a silent substitution.
