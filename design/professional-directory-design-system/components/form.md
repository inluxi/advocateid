# Form controls

## Text input / select trigger — `.fld`

Height 46px (40px in a compact header), border `1px solid #201E1D`, background
`#FFFFFF`, padding 0 12px, font 13px/500, placeholder `ink-800`. Leading 16px icon
with an 8px gap where the field has a role (search, location). Radius 0.

| State | Treatment |
| --- | --- |
| Focus | `outline: 2px solid var(--brand); outline-offset: 2px` |
| Filled | Label colour moves to `--color-text` |
| Error | Border `#E74C3C`, 12px message below in the same colour |
| Disabled | 45% opacity |

## Search composite

Desktop: `grid-template-columns: 180px 1fr 240px auto` — vertical select, query,
city, submit. Mobile: three stacked rows, submit full width at 48px.

## Radio / checkbox

12px square, `1px solid #201E1D`, filled `var(--brand)` when selected. No round
radios. Label 13px/500 with an 8px gap; unselected labels drop to `ink-700`.

## Segmented control

Single 1px outlined row, no gaps between options. Active segment: fill `#201E1D`,
label `#F3F2F2`, 12px/700 uppercase at 0.06em. Used for the pricing
monthly/yearly switch and the EN/native language toggle.

## Colour picker (tenant branding)

A curated swatch row, **not** a free `input[type=color]`: 60×60px squares, 2px
`var(--brand)` border when active, 1px `#D7D3D3` when not. Presets are ink navy,
platform red, directory blue, forest, ochre. A free picker lets tenants choose
untested, inaccessible colours; the curated set guarantees the 4.5:1 floor for
`--brand-ink`.

## Props

```ts
interface FieldProps {
  kind: 'text' | 'select' | 'radio' | 'checkbox' | 'segmented' | 'colorSwatch';
  label?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  value: string;
  options?: { value: string; label: string }[];
  error?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}
```
