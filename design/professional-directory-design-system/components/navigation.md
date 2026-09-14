# Navigation

## Platform header (Basic tier and all directory pages)

| | Mobile | Desktop |
| --- | --- | --- |
| Height | 52px | 64px |
| Padding | 0 16px | 0 32px |
| Brand | 14px accent square + "TOPLAWYER.in" 800/13px | 16px square + 800/16px |
| Items | hamburger 20px | Find a lawyer · Chartered accountants · Tax experts · Courts · Cities |
| Language | EN / native toggle, 1px outlined | same |
| Action | — | "List your practice", 1px outlined, 8px 12px |
| Bottom | 2px solid `#201E1D` | 2px solid `#201E1D` |

The `.in` suffix in the wordmark is weight 500 in `ink-700` against the 800 mark.

## Tenant header (Professional)

Same geometry, brand colour replaces platform red, wordmark becomes the firm name, and
the nav shortens to the tenant's own sections (Practice · Matters · Posts · Contact) plus
a filled "Book a consultation".

## White-label header (Premium)

70px on desktop, full `var(--brand)` field, white wordmark, no platform mark anywhere.
Nav items in `rgba(255,255,255,.9)`; the CTA inverts to white-on-brand. Footer carries
the tenant's own columns plus a canonical link back to the directory profile.

## Mobile sticky contact bar

Fixed to the bottom of the profile screens: 3-column grid, 1px gaps on a `var(--brand)`
ground, 2px top rule, 48px tall. WhatsApp primary; Call and Email secondary.

## Tab bar (Professional, Premium)

Overview / Posts / Reviews / Offices. Tab padding 14px 18px, 12px/700 uppercase at 0.1em,
inactive `ink-700`, active filled `var(--brand)` with a white label. 2px rule beneath.
Horizontally scrollable on mobile, no fade masks.

## Rules

- Sticky on scroll, with `shadow-sm` once scrolled. Never a blur.
- Breadcrumbs sit under the header as a kicker: "Home · Lawyers · Delhi · IP Law".
- Exactly one h1 per page; breadcrumbs and kickers are not headings.

## Props

```ts
interface HeaderProps {
  mode: 'platform' | 'tenant' | 'whiteLabel';
  brandName: string;
  brandColor?: string;
  items: { label: string; href: string }[];
  languages?: { code: string; label: string }[];
  cta?: { label: string; href: string };
}
```
