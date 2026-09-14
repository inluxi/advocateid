# Badge, tag and kicker

Three distinct things. Keep them distinct.

## Tag (outline) — `.tag.tag-outline`

Square. Height auto, padding 5px 9px, font 12px/500, background `#F8F4F4`,
border `1px solid var(--brand)`, label `var(--brand-ink)`.
Used for expertise, practice areas and filter chips. Gap between tags 6–7px in a
wrapping flex row.

## Badge (filled)

Padding 4px 8px, font 10px/600, letter-spacing 0.1em, uppercase, background
`var(--brand)`, label `#FFFFFF`. Used for case outcomes (FAVOURABLE, SUSTAINED,
SETTLED), tier markers (PREMIUM, VERIFIED) and the FREE LISTING corner flag.

## Kicker — section label

Not a badge, but the same family: 10px/600, uppercase, 0.14em tracking, `ink-700`,
14px bottom margin. Optionally paired with the same word in the local script at
11px/500 sentence case. Every section in the product opens with one.

## Sizes

| Size | Font | Padding |
| --- | --- | --- |
| sm | 10px | 3px 6px |
| md | 12px | 5px 9px |
| lg | 14px | 7px 12px |

## Rules

- No pills. `border-radius` is 0, including the "full" token.
- Never more than one filled badge colour in a row; outline tags carry the rest.
- A tag row caps at the tier's item limit — 5 on Basic, 10 on Professional and Premium.

## Props

```ts
interface BadgeProps {
  label: string;
  kind: 'tag' | 'filled' | 'kicker';
  size?: 'sm' | 'md' | 'lg';
  nativeLabel?: string;   // kicker only
}
```
