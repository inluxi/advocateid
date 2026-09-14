# Typography

**Archivo only**, from Google Fonts, weights 400 / 500 / 600 / 700 / 800. Devanagari,
Kannada and Tamil come from the matching Noto Sans families.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;700&display=swap">
```

## Scale (desktop)

| Role | Size | Weight | Tracking | Leading |
| --- | --- | --- | --- | --- |
| Masthead | 78px | 800 | -0.045em | 0.95 |
| h1 | 56px | 800 | -0.035em | 1.0 |
| h2 | 38px | 800 | -0.03em | 1.05 |
| Section head | 22px | 800 | -0.02em | 1.2 |
| Card title | 16px | 700 | -0.01em | 1.25 |
| Lead | 16px | 400 | 0 | 1.6 |
| Body | 15px | 400 | 0 | 1.65 |
| Small | 13px | 400–500 | 0 | 1.5 |
| Metadata | 12px | 400 | 0 | 1.4 |
| Kicker | 10px | 600 | 0.14em | 1 |
| Stat number | 34–38px | 800 | -0.03em | 1 |

Mobile steps are in `responsive-rules.md`.

## Rules

1. Flush left, always. Never centre a heading or a paragraph.
2. One h1 per page. Kickers are h6 semantically, styled as labels.
3. Body copy caps at a 620–720px measure; `text-wrap: pretty` on paragraphs.
4. Uppercase only in kickers, badges and the Professional masthead name.
5. Minimum 13px for reading text; 12px only for metadata.
6. Tabular figures (`font-variant-numeric: tabular-nums`) in stat strips, prices and
   the comparison table.

## Bilingual setting

The page is ~90% English. The local language carries two positions: the professional's
name in native script directly under the English name, and one bio line as a
pull-quote with a 2px `var(--brand)` left border. Native script sits 2–3px larger than
Latin at the same optical size, at weight 500, in `ink-800`. City and section labels may
carry an optional native gloss at 11px.

The EN / native header toggle is a state display in the mockups; wire it to swap those
two positions plus the section glosses.
