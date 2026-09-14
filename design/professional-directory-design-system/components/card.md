# Card — professional listing

Three shapes are in use. Do not invent a fourth.

## A. Portrait card (grids: homepage, city index, landing, institution)

```
┌──────────────────┐
│  portrait 4:5    │  white ground, 1px #D7D3D3 bottom border
├──────────────────┤
│ Name        700  │  16px
│ नाम          500  │  13px, ink-700 — native script, optional
│ Practice · City  │  13px, ink-800
│ 4.8 ★ 12 reviews │  13px; star in var(--brand)
└──────────────────┘
```
Surface `#FFFFFF`, `shadow-sm`, body padding 14px. Grid: 4 columns desktop,
2 tablet, 1 mobile, 16px gap.

## B. Row card (mobile lists)

64–76px portrait at 4:5, flush left, 12px gap, text block right. Card padding 12px.
Used wherever a mobile list needs a face; never stack the portrait above the text on mobile.

## C. Result card (search results, desktop)

Three columns: 132px portrait (4:5) / flexible detail column / 190px action column
carrying the consultation fee and the WhatsApp + View profile buttons. Row padding
20px 28px, separated by 1px hairlines, the whole list closed by a 2px rule.

## Case-outcome card

```
┌────────────────────────────────────────────┐
│ ▔▔▔ 3px top border in var(--brand)         │
│ Patent Infringement Dispute          700/16│
│ One-sentence summary.                400/13│
│ [Patent Law] [FAVOURABLE] Delhi HC · 2023  │
└────────────────────────────────────────────┘
```
The metadata row is mandatory and ordered: practice-area tag (outline), outcome badge
(filled `var(--brand)`, uppercase 10px/600), then full court name and year. Never
abbreviate the court in the badge row — "Delhi High Court", not "Delhi HC".

## Tier variants

| Tier | Card behaviour |
| --- | --- |
| Basic | Competitor cards render below the profile; brand colour locked to platform red |
| Professional | Competitor block suppressed; cards adopt `var(--brand)` |
| Premium | As Professional, plus no platform attribution anywhere on the card |

## Props

```ts
interface ProfessionalCardProps {
  shape: 'portrait' | 'row' | 'result';
  name: string;
  nativeName?: string;
  photoUrl?: string;           // 4:5, white background
  practice: string;
  city: string;
  rating: number;
  reviewCount: number;
  tier?: 'basic' | 'professional' | 'premium';
  verified?: boolean;
  consultationFee?: number;    // result shape only
  tags?: string[];
  onContact?: () => void;
  onView?: () => void;
}
```
