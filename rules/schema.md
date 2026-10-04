# /rules/schema.md: JSON-LD schemas and SEO markup

*Defines the structured data for search engines. Includes locale hacks for Malayalam and the "my page first" ranking boost.*

---

## 1. Advocate page (Attorney schema)

**When:** Every advocate page (`/{slug}`)

**Schema fields:**
```json
{
  "@context": "https://schema.org",
  "@type": "Attorney",
  "name": "{page.name}",
  "url": "{page_url}",
  "image": "{photo_url}",
  "description": "{page.bio} (first 160 chars for meta description)",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "{office.address}",
    "addressLocality": "{locality.name}",
    "postalCode": "{pincode}",
    "addressCountry": "IN"
  },
  "areaOfLaw": ["{category.name}", ...],
  "knowsAbout": ["{category.name}"],
  "worksLocation": {
    "@type": "PostalAddress",
    "addressLocality": "{district.name}",
    "addressCountry": "IN"
  },
  "aggregateRating": null,
  "review": null,
  "priceRange": null
}
```

**Notes:**
- No `aggregateRating`, `review`, or `priceRange` (counsel review pending; MVP 2+).
- `areaOfLaw` maps to the practice areas; use the category `name` not the code.
- If multiple offices, use the main office for the schema address; secondary offices are on their own pages.
- Do NOT include "best" or "top" in the description; stick to the bio.
- `url` must be the canonical URL (see /rules/seo.md).

---

## 2. Firm page (LegalService schema)

**When:** Every firm page (`/{slug}`)

**Schema fields:**
```json
{
  "@context": "https://schema.org",
  "@type": "LegalService",
  "name": "{page.name}",
  "url": "{page_url}",
  "image": "{banner_url}",
  "description": "{page.bio}",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "{main_office.address}",
    "addressLocality": "{main_office.locality.name}",
    "postalCode": "{main_office.pincode}",
    "addressCountry": "IN"
  },
  "areaOfLaw": ["{category.name}", ...],
  "knowsAbout": ["{category.name}"],
  "seeks": "LegalService",
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Legal Services",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "{category.name}"
        }
      }
    ]
  },
  "employee": [
    {
      "@type": "Person",
      "name": "{lawyer.name}",
      "jobTitle": "{lawyer.title}",
      "image": "{lawyer.photo_url}"
    }
  ],
  "aggregateRating": null,
  "review": null,
  "priceRange": null
}
```

**Notes:**
- The `employee` array lists up to 5 lawyers (by `sort` order on Premium; all visible ones on Professional/Basic).
- On a custom domain, the `url` points to the domain root, not advocateid.in.
- No fee, rating, or testimonial fields.

---

## 3. Office page (LegalService with location focus)

**When:** Office pages (`/{slug}/o/{id}/{office-seo}`)

**Schema fields:**
```json
{
  "@context": "https://schema.org",
  "@type": "LegalService",
  "name": "{office.name} - {page.name}",
  "url": "{office_page_url}",
  "image": "{page.photo_url}",
  "description": "{office.about}",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "{office.address}",
    "addressLocality": "{office.locality.name}",
    "postalCode": "{office.pincode}",
    "addressCountry": "IN",
    "latitude": "{office.lat}",
    "longitude": "{office.lng}"
  },
  "telephone": "{office.phone}",
  "areaOfLaw": ["{category.name}", ...],
  "branchOf": {
    "@type": "LegalService",
    "name": "{page.name}",
    "url": "{page_url}"
  }
}
```

**Notes:**
- Offices without an `about` description stay out of search results (noindex).
- If an office has `focus_courts`, those can be mentioned in the description: "Specialising in [court name] matters."
- Include lat/lng from the office record (used for local search).

---

## 4. Post page (Article schema)

**When:** Global post page (`/post/{id}/{seo}`) and custom-domain post (`/p/{id}/{seo}`)

**Schema fields:**
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "{post.title}",
  "description": "{first 160 chars of post.body}",
  "image": "{cover_image_url}",
  "datePublished": "{post.created_at}",
  "dateModified": "{post.updated_at}",
  "author": {
    "@type": "Person",
    "name": "{author_page.name}",
    "url": "{author_page_url}"
  },
  "articleBody": "{post.body}",
  "articleSection": "{post.categories[0].name}",
  "keywords": "{post.categories.map(c => c.name).join(', ')}",
  "inLanguage": "{post.language}",
  "mentions": {
    "@type": "Thing",
    "name": "{post.court.name}"
  }
}
```

**Notes:**
- `articleSection` is the first category (sorted by display order).
- `keywords` is comma-separated category names.
- If the post has a court tag, include a `mentions` block with the court.
- No author aggregateRating or review.

---

## 5. Court update page (Article schema for contributed posts)

**When:** Court update article (`/u/{id}/{seo}`)

**Schema fields:**
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "{update.title}",
  "description": "{first 160 chars of update.body}",
  "image": "{optional_image}",
  "datePublished": "{update.created_at}",
  "dateModified": "{update.updated_at}",
  "author": {
    "@type": "Person",
    "name": "{author_page.name}",
    "url": "{author_page_url}"
  },
  "articleBody": "{update.body}",
  "about": {
    "@type": "GovernmentOrganization",
    "name": "{court.name}",
    "url": "{court_page_url}"
  },
  "inLanguage": "{update.language}"
}
```

**Notes:**
- The `about` field links to the court (GovernmentOrganization).
- Contributed updates credit the author: "Contributed by [page name]" in the UI and schema.

---

## 6. Court page (GovernmentOrganization schema)

**When:** Court pages (`/c/{id}/{court-name-location-seo}`)

**Schema fields:**
```json
{
  "@context": "https://schema.org",
  "@type": "GovernmentOrganization",
  "name": "{court.name}",
  "url": "{court_page_url}",
  "description": "{court.address}. Jurisdiction: {locality.name}, {district.name}.",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "{court.address}",
    "addressLocality": "{locality.name}",
    "postalCode": "{pincode}",
    "addressCountry": "IN",
    "latitude": "{court.lat}",
    "longitude": "{court.lng}"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "Main Office",
    "telephone": "{court.phone}"
  },
  "sameAs": [],
  "hasMap": "{google_maps_url}"
}
```

**Notes:**
- Court details (phone, keys like "Chief Judge") come from `court_details` table.
- Include a link to the court's own website if available (in `sameAs`).

---

## 7. BreadcrumbList (all pages)

**Include on all pages except home.** Shows the navigation path.

**Example for `/c/{id}/{seo}` (court page):**
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://advocateid.in/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "{district.name}",
      "item": "https://advocateid.in/search?d={district.code}"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "{court.name}",
      "item": "{court_page_url}"
    }
  ]
}
```

**Example for `/{slug}` (advocate/firm page):**
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://advocateid.in/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "{district.name}",
      "item": "https://advocateid.in/search?d={district.code}"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "{page.name}",
      "item": "{page_url}"
    }
  ]
}
```

---

## 8. "My page first" hack for practice-area clicks

**Problem:** When a visitor clicks a practice area on a page (e.g., "Family Law" on an advocate's profile), they land on `/posts?author={pageId}&category={code}`. That page should show the source page's posts first and highlight the source.

**Implementation:**

1. **In the database (`search_index`):** add a `source_boost` integer (0 by default, set to a high value for the source page in the query).

2. **In the ranking query:**
   - If `source_boost > 0`, add it to the score before sorting.
   - This pushes the source page to the top regardless of relevance/nearness/quality.

3. **In the UI:** show a small badge or note:
   ```
   "You came from: [page name]" (with a small link icon)
   ```

4. **SEO:** this page is `noindex` with canonical to the base search page. No boost in search engines; the boost is only visible to the visitor.

**Code example (pseudo):**
```typescript
let score = 0.45 * relevance + 0.25 * nearness + 0.30 * quality;
if (sourceBoost > 0) {
  score += sourceBoost; // Overrides normal ranking
}
// Sort by score descending
```

**Result:** the source page appears first, with a note to the visitor. Improves click-back rates and feels intentional.

---

## 9. Locale hacks for Malayalam

### 9.1 Font support
- **Current:** Poppins (Latin only); does NOT render Malayalam.
- **Replacement:** use a font that covers both Latin and Malayalam Script.
  - **Options:**
    - Noto Sans (supports all scripts; large file)
    - Noto Sans Devanagari + Noto Sans Tamil (Malayalam uses Tamil script in many fonts)
    - Manjari (open source; Malayalam specialist; Google Fonts)
    - Use system fonts: `-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans Malayalam", sans-serif`

- **Implementation:** in the CSS, load the font and apply it site-wide:
  ```css
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&family=Noto+Sans+Malayalam:wght@400;600;700&display=swap');
  
  body {
    font-family: 'Noto Sans', 'Noto Sans Malayalam', sans-serif;
  }
  ```

### 9.2 Direction and spacing
- Malayalam text uses left-to-right (LTR) direction like English.
- No special CSS needed; but test character spacing and line-height (may need 1.6 or higher for readability).

### 9.3 Truncation and line-clamping
- Malayalam words are often longer than English equivalents.
- Use `word-break: break-word` on cards and lists to avoid overflow.
- Line clamps (e.g., 3 lines) may cut off text mid-word; test on each card.

### 9.4 Keyboard input (OTP, slug)
- Slug input: restrict to a-z, digits, hyphen (no Malayalam allowed; stays global per decision D9).
- OTP input: accept 0–9 (standard).
- Names and text fields: accept Malayalam Unicode (U+0D00–U+0D7F).

### 9.5 Search and sorting
- D1 collation: use `COLLATE NOCASE` for case-insensitive search.
- Malayalam sorting: handled by the database collation. Confirm with counsel if state-specific sorting is needed.

### 9.6 Hreflang links
- Every page with Malayalam content (`/ml/...`) must have alternate `hreflang` links to the English version:
  ```html
  <link rel="alternate" hreflang="en" href="https://advocateid.in/c/{id}/{seo}" />
  <link rel="alternate" hreflang="ml" href="https://advocateid.in/ml/c/{id}/{seo}" />
  <link rel="alternate" hreflang="x-default" href="https://advocateid.in/c/{id}/{seo}" />
  ```

### 9.7 Locale-specific content
- **Court names:** stored in `court_translations` table with `language_code` (e.g., 'ml').
- **Categories:** stored in the `categories` table with localized names.
- **Place names:** stored in `localities` with `local_name` (e.g., 'Kerala' = 'കേരളം').
- **UI strings:** from translation files (i18n).

### 9.8 Avatar and cultural sensitivity
- No assumptions about name/gender.
- Test profile pictures and banner images with Malayalam text overlays (if used).

---

## 10. Meta tags and OpenGraph

**On all pages:**
```html
<meta name="description" content="{description, max 160 chars}" />
<meta name="robots" content="index, follow" />
<meta name="theme-color" content="#FFFFFF" />

<meta property="og:title" content="{title}" />
<meta property="og:description" content="{description}" />
<meta property="og:image" content="{image_url}" />
<meta property="og:url" content="{canonical_url}" />
<meta property="og:type" content="website" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{title}" />
<meta name="twitter:description" content="{description}" />
<meta name="twitter:image" content="{image_url}" />

<link rel="canonical" content="{canonical_url}" />
```

**Noindex pages:**
```html
<meta name="robots" content="noindex, nofollow" />
<link rel="canonical" content="{base_page_url}" />
```

**Mobile:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
```

---

## 11. Implementation checklist

- [ ] Attorney schema on advocate pages
- [ ] LegalService schema on firm pages
- [ ] Article schema on posts and court updates
- [ ] GovernmentOrganization schema on court pages
- [ ] BreadcrumbList on all pages (except home)
- [ ] Canonical URL correct (see /rules/seo.md)
- [ ] Meta description pulled from bio (first 160 chars, no banned words)
- [ ] OG image points to banner (firm) or photo (advocate) or cover (post)
- [ ] Malayalam font loaded and tested
- [ ] Hreflang links on /ml/ pages
- [ ] Noindex + canonical on /search, /compare, /posts?author=&category=
- [ ] "My page first" ranking boost implemented on `/posts?author=&category=`
- [ ] Schema validation pass (use Google's Schema Validator)
- [ ] Test with Search Console

---

## 12. Testing and validation

**Tools:**
- Google Structured Data Testing Tool (supports JSON-LD)
- Google Rich Results Test
- Schema.org validator

**Checklist:**
1. Copy the page source.
2. Paste into Google's Rich Results Test.
3. Fix any warnings or errors.
4. Validate in Search Console once live.

**Common errors:**
- Missing `@context`: always include `"https://schema.org"`.
- Wrong field types (e.g., `name` should be string, not object).
- Incomplete address (missing country).
- Non-canonical URL in schema (must match the page's canonical).
