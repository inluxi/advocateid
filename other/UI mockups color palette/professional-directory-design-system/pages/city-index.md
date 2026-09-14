# City index

`/delhi` — one hub per city, all three verticals.

## Structure

| # | Section | Mobile | Desktop |
| --- | --- | --- | --- |
| 1 | Header | 52px | 64px |
| 2 | City heading | h1 30px + native name + intro + search | h1 52px + native name, search composite right |
| 3 | Counts strip | 4 cells, 2×2 | 4 cells in a row |
| 4 | By practice area | 8 tags | 12 tags |
| 5 | By court or tribunal | 4 rows | 6 rows, left half |
| 6 | By locality | 2-col, 6 | 2-col, 8, right half |
| 7 | Top rated in city | 3 row cards | 4 portrait cards + "see all" |
| 8 | About practising here | 1 paragraph | 2 paragraphs, 720px measure |
| 9 | Nearby cities | 4 rows | 4 cells |

The native city name (नई दिल्ली) sits directly under the English h1 at 24px/500 — the
10% local-language layer, alongside the professional's name and one bio line.

## Template variables

```
{city} {cityNative} {professionalCount} {lawyerCount} {caCount} {taxCount}
{courtCount} {courts[]} {practiceAreas[]} {localities[]} {topRated[]}
{aboutParagraphs[]} {nearbyCities[]}
```
