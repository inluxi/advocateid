# Button

Solid fill for the primary action, outlined for secondary, text-only for tertiary.
Labels are **flush left** — a button wider than its label starts the text at the left
padding edge, trailing icon and all. Never centre a button label.

## Variants

| Variant | Fill | Border | Label |
| --- | --- | --- | --- |
| Primary | `var(--brand)` | none | `#FFFFFF` |
| Secondary | `#F3F2F2` | `1px solid var(--brand)` | `var(--brand-ink)` |
| Tertiary | transparent | none | `var(--brand-ink)` |
| On-colour (inside a brand field) | `#FFFFFF` | none | `var(--brand-ink)` |
| On-colour secondary | transparent | `1px solid rgba(255,255,255,.6)` | `#FFFFFF` |

The on-colour pair exists because the hero masthead is a full brand field — a brand-filled
button disappears in it. In the built mockups the contact actions sit on a light action bar
*below* the masthead for exactly this reason; it survives light and dark themes.

## Sizes

| Size | Height | Padding X | Font |
| --- | --- | --- | --- |
| sm | 40px | 14px | 12px / 600 |
| md | 44px | 16px | 13px / 600 |
| lg | 48px | 22px | 13–14px / 600–700 |

Icon + label gap: 8px. Icon size: 15–17px, stroke 2.

## States

| State | Treatment |
| --- | --- |
| Default | Flat fill, no shadow |
| Hover | One ramp step darker (`accent-600` on light, `accent-400` on dark) |
| Active | Two steps darker, no transform |
| Focus-visible | `outline: 2px solid var(--brand); outline-offset: 2px` |
| Disabled | 45% opacity, `cursor: default` |
| Loading | Label holds, 15px spinner replaces the icon |

## Responsive

- Mobile: full width in stacked forms; 44px minimum height. The sticky contact bar is a
  3-column grid (1.5fr WhatsApp / 1fr Call / 1fr Email) at 48px.
- Desktop: auto width, 48px for primary actions. `white-space: nowrap` on any label that
  carries a phone number.

## Props

```ts
interface ButtonProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'onColor' | 'onColorSecondary';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;      // leading
  trailingIcon?: React.ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  href?: string;               // renders an <a> with button styling
  onClick?: () => void;
}
```
