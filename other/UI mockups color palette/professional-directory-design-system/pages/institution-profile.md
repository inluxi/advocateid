# Institution profile

`/court/delhi-high-court` — one template for every court, tribunal and statutory body.

## Desktop

```
[Header 64px]
[Breadcrumb kicker]
[110px crest │ h1 52px + native name + 680px description │ 210px actions
                                                          Open in Google Maps
                                                          Cause list
                                                          Official website]
[Facts strip — established | sanctioned judges | listed advocates | dedicated division]
┌─ flexible ────────────────────────┬─ 380px ─────────────┐
│ About the court — 2 paragraphs    │ Location + map       │
│ Advocates practising here — 3 up  │ Sitting hours        │
│ Matters heard here — tag set      │ Related institutions │
└───────────────────────────────────┴──────────────────────┘
2px rule between the columns
```

## Mobile

Header → breadcrumb → 64px crest beside h1 26px + native name → description →
2×2 facts strip → about → location with map and actions → advocates (row cards) →
matters heard → related institutions.

## Template variables

```
{name} {nativeName} {type} {crestUrl} {description} {established}
{sanctionedStrength} {listedAdvocateCount} {specialDivision}
{aboutParagraphs[]} {address} {mapUrl} {causeListUrl} {officialUrl}
{sittingHours[]} {advocates[]} {mattersHeard[]} {relatedInstitutions[]}
```

Crests are official emblems — render them `object-fit: contain` on the surface ground,
never cropped, tinted or placed on a brand colour.
