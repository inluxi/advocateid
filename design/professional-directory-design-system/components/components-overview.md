# Components overview

| Component | File | Where it appears |
| --- | --- | --- |
| Button | button.md | Every screen; contact actions, search submit, plan selection |
| Card | card.md | Search results, homepage grids, city index, case outcomes, reviews, offices |
| Badge / tag / kicker | badge.md | Expertise, practice areas, outcome labels, tier markers, every section label |
| Hero / masthead | hero.md | Profile pages (both treatments) |
| Form | form.md | Search composites, filter rail, pricing toggle, tenant colour picker |
| Navigation | navigation.md | Platform, tenant and white-label headers; tab bar; mobile contact bar |

## Composition rules

1. **Sections, not boxes.** A page is a vertical stack of full-bleed sections divided by
   2px rules. Cards appear *inside* sections, never as the page's primary rhythm.
2. **Every section opens with a kicker.** No section starts with body copy.
3. **One accent field per page.** The red (or brand) poster statement — the upsell band,
   the closing CTA — is used once. Everything else is ink on ground.
4. **Layout with flex/grid + `gap`.** Never margin-spaced inline siblings.
5. **Inline styles or utility classes, not per-page stylesheets.** The mockups are inline
   throughout so a designer can edit any element directly.

## Reusable primitives worth extracting first

```
<Kicker>            10px/600 uppercase label, optional native script
<Rule>              2px section divider / 1px row hairline
<StatStrip>         n equal cells, 1px separated, big number + uppercase label
<Portrait>          4:5 white-ground image with a fallback initial
<MetaRow>           tag + badge + court/date, wrapping
<IndexList>         label/count rows for court, city and locality indexes
```
These six cover roughly 80% of the markup across the nine screens.
