# Developer handoff

## 1. Wire the tokens first

```js
import tokens from './design-tokens.json';
```

Or emit CSS variables once at the app root:

```css
:root {
  --color-bg:#F3F2F2; --color-surface:#EAE9E9; --color-text:#201E1D;
  --color-platform:#EC3013; --color-platform-ink:#AE1800;
  --ink-300:#D7D3D3; --ink-700:#605D5D; --ink-800:#444141;
  --brand:#EC3013;        /* overwritten per tenant */
  --brand-ink:#AE1800;    /* text-safe version of --brand */
  --space-md:16px; --space-lg:24px; --space-xl:32px;
  --radius:0px;
  --shadow-sm:0 1px 2px rgba(45,43,43,.14);
}
```

Never hard-code a hex in a component. Every colour resolves from a variable so the
tenant takeover in `color-customization.md` works without touching component code.

## 2. Build components from `components/`

Each file gives variants, sizes, states, responsive behaviour and a TypeScript props
interface. Build them as presentational components that read CSS variables — no colour
logic inside the component.

## 3. Compose pages from `pages/`

Each page spec gives the mobile and desktop structure as an ASCII block diagram plus key
measurements. Section order is normative; it drives both the visual rhythm and the SEO
outline (one h1, kickers as h6).

## 4. Responsive

`specifications/responsive-rules.md` is mobile-first: 375 → 768 → 1200. Type and spacing
scale on named steps, not fluid clamps, so the grid stays on the rules.

## 5. Tier gating

`specifications/variants.md` maps every feature to Basic / Professional / Premium and
states what changes visually. Gate on the server — the Free tier's competitor block and
the Premium analytics band must not be client-toggleable.

## 6. Accessibility floor

- Body text at 4.5:1 against its ground. `#EC3013` passes only at headline scale; use
  `--brand-ink` for paragraph-size accent text.
- Focus is `2px solid var(--brand)` at `outline-offset: 2px`. Never remove it.
- Mobile hit targets 44px minimum; primary actions 48px.
- Every portrait needs real alt text ("J. Gupta, IP law specialist, New Delhi").

## 7. What this package does not contain

Production React source, API contracts, and the Google Maps embeds (the mockups use
labelled placeholders). Brand glyphs for LinkedIn/Facebook/Instagram/X are lettermark
placeholders — drop in the official SVGs.
