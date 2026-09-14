# Colour customization

## Who can customize

| Tier | Customization |
| --- | --- |
| Basic | None. Platform red, platform chrome. |
| Professional | Primary colour from the curated preset set. |
| Premium | Primary colour, plus own header, footer and domain. |

## Implementation

Two variables on the page root, written from the tenant record:

```css
.tenant-scope { --brand: #16233F; --brand-ink: #16233F; }
```

- `--brand` — fills, borders, rules, badges, active tabs, stars, icons.
- `--brand-ink` — any text at paragraph size in the brand colour. For dark brand
  colours the two are identical; for light ones (`#EC3013`, `#E67E22`) `--brand-ink`
  is the 700 ramp step so body text still clears 4.5:1.

Derive the ramp once per tenant in OKLCH on the same lightness scale as the platform
ramp, and store the steps — do not compute them per render.

## What changes with the brand colour

Primary buttons · secondary button borders and labels · section rule colour on the
profile · outline tag borders and labels · outcome badges · active tab fill ·
star rating · verification mark · the masthead field · the analytics band ·
focus outlines · link colour.

## What never changes

| Role | Value |
| --- | --- |
| Body text | `#201E1D` |
| Ground | `#F3F2F2` |
| Card surface | `#FFFFFF` |
| Alternate surface | `#EAE9E9` |
| Hairlines | `#D7D3D3` |
| Muted text | `#605D5D` |
| Error / success / warning | Semantic tokens, never branded |

## Guardrails

1. **Curated presets, not a free picker.** A free `input[type=color]` lets tenants pick
   colours that fail contrast and read as broken. Offer ink navy, platform red,
   directory blue, forest and ochre; add a preset only after checking it.
2. **Contrast gate.** Reject any custom colour whose 700 step fails 4.5:1 on
   `#F3F2F2`, and any whose white-on-brand button fails 4.5:1.
3. **One accent field per page** regardless of tier.
4. **Never brand the semantic colours** — an error must not arrive in the tenant's hue.
