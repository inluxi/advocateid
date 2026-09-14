# Spacing and layout

## Scale

`4 · 8 · 16 · 24 · 32 · 48` — xs, sm, md, lg, xl, xxl. Nothing off-scale except
optical corrections under 4px.

## Container

1200px max, centred, with 36px inner padding at desktop and 18px at mobile. Content
measure caps at 620–720px regardless of container width.

## Rules and dividers

| Use | Treatment |
| --- | --- |
| Between major sections | `border-top: 2px solid #201E1D` |
| Between rows in a section | `border-top: 1px solid #D7D3D3` |
| Between grid cells (strips) | `gap: 1px` on an ink-filled parent |
| Column separator | `border-right: 2px solid #201E1D` |
| Under a tenant header | `2px solid var(--brand)` |

The 1px-gap-on-ink-parent trick is how every stat strip and cell grid is built — it gives
a true hairline grid with no double borders.

## Grids

| Context | Desktop | Mobile |
| --- | --- | --- |
| Portrait card grid | `repeat(4,1fr)`, 16px | 1 column, 10px |
| Profile (ruled) | `440px 1fr` | stacked |
| Profile (masthead) | `420px 1fr` | stacked |
| Search | `260px 1fr` | rail becomes a chip row |
| Institution | `1fr 380px` | stacked |
| Pricing | `repeat(3,1fr)`, 20px | stacked, 14px |
| Index blocks | `1fr 1fr` then `1fr 1fr` inside | single, then 2-col counts |

## Composition

Lay out every sibling group with flex or grid and `gap` — never margin-spaced inline
siblings. Gap spacing survives drag-reorder, delete and duplicate in the editor;
whitespace text nodes don't.

## Vertical rhythm

Section padding 20px 18px (mobile) / 26px 36px (desktop). Kicker to content: 14px.
Heading to body: 10–16px. Body to action: 16–20px. No section is shorter than 20px
of padding; none exceeds 48px.
