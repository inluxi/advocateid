# Hero / profile masthead

Two treatments, one per tier band.

## Basic (ruled)

```
mobile                          desktop (1200)
┌───────────────┐               ┌──────────┬──────────────────────┐
│ header 52px   │               │ header 64px                     │
├───────────────┤               ├──────────┼──────────────────────┤
│ portrait 4:5  │               │ portrait │ kicker               │
│ [FREE LISTING]│               │   4:5    │ Name      800/56px   │
├───────────────┤               │  white   │ नाम        500/24px   │
│ kicker        │               │  ground  │ Practice · 4.8 ★     │
│ Name 800/30px │               │          │ [WhatsApp][Call][…]  │
│ नाम   500/17px │               └──────────┴──────────────────────┘
│ Practice/4.8★ │               2px rule between the columns
└───────────────┘
```

## Professional & Premium (masthead)

The name runs as an uppercase masthead **on a full `var(--brand)` field**, portrait on
the **left** at 4:5 on white so an uploaded white-background photo sits flush against the
colour. Text column is a centred flex column so it aligns to the middle of the portrait.
Below the field, in order:

1. **Social row** inside the masthead — LinkedIn, Facebook, Instagram, X, Google Business
   as 36px square outlined tiles. This is a news-style site; the links belong in the title
   header, not a sidebar.
2. **Action bar** on the light ground — WhatsApp (primary), Call, Email (secondary
   outlined), plus a "typically replies within 2 hours" note pushed right. Actions live
   here rather than in the coloured field so they stay legible in light and dark themes.
3. **Credential strip** — four cells, 1px-separated: years in practice, matters concluded,
   courts of record, median response.
4. **Tab bar** — Overview / Posts / Reviews / Offices, 2px rule under it, active tab
   filled `var(--brand)` with white label.

## Measurements

| | Mobile | Desktop |
| --- | --- | --- |
| Portrait | full width, 4:5 | 420px column, 4:5 |
| Name | 36px / 800 / -0.04em | 78px / 800 / -0.045em |
| Native name | 18px / 500 | 26px / 500 |
| Field padding | 20px 18px 22px | 40px 36px 34px |

## Props

```ts
interface HeroProps {
  treatment: 'ruled' | 'masthead';
  name: string;
  nativeName?: string;
  headline: string;
  photoUrl?: string;
  rating: number;
  reviewCount: number;
  verification: 'phone' | 'email+phone' | 'full';
  brandColor?: string;         // Professional and Premium only
  socials?: { network: string; url: string }[];
  tabs?: { id: string; label: string }[];
  stats?: { value: string; label: string }[];
}
```
