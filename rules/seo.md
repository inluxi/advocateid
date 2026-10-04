# /rules/seo.md: SEO and search engine rules

*Covers indexable pages, noindex rules, canonical URLs, language handling (hreflang), and sitemap structure.*

---

## 1. Indexable pages (search engines welcome)

**These pages are discoverable by Google and Bing:**

| Route | Index | Description | Notes |
|-------|-------|-------------|-------|
| `/` | Yes | Home | Core page |
| `/search?d={code}` | Yes | Search by district (required) | Main entry point; readable path `/d/{code}` |
| `/search?d={code}&cat={code}` | Yes | District + practice area | Readable path `/d/{code}/{cat}/{code}` |
| `/c/{id}/{seo}` | Yes | Court page | `{id}` decides; wrong `{seo}` → 301 redirect |
| `/c/{id}/{seo}?cat={code}` | Yes | Court + practice area | Readable path: `/c/{id}/{seo}/{cat}/{code}` |
| `/l/{id}/{seo}` | Yes | Location page | District or city listing advocates |
| `/l/{id}/{seo}/{cat}/{code}` | Yes | Location + practice area | E.g., `/l/kerala/{location}/family-law` |
| `/practice` | Yes | Practice areas index | Listing all categories |
| `/practice/{code}` | Yes | Practice area detail | E.g., `/practice/family-law` |
| `/{slug}` | Yes | Advocate or firm profile | Main profile page |
| `/{slug}/offices` | Yes | Office listings (firm) | List branch offices |
| `/{slug}/o/{id}/{seo}` | Yes | Single office page | If it has a description |
| `/post/{id}/{seo}` | Yes | Global post page | Canonical for Basic/Professional |
| `/post/{id}/{seo}?page=2` | Maybe | Post pagination | See noindex rules below |
| `/u/{id}/{seo}` | Yes | Court update article | Contributed by advocates |
| `/about`, `/contact`, `/terms`, `/privacy` | Yes | Info pages | Standard pages |
| `/grievance` | Yes | Grievance submission | Required by law |
| `/sitemap.xml`, `/sitemaps/{type}-{n}.xml` | Yes (in robots.txt) | Sitemaps | No `<meta robots>` needed |

---

## 2. Noindex pages (search engines stay out)

**These pages do NOT appear in search results but are visible to visitors:**

| Route | Status | Reason | Canonical |
|-------|--------|--------|-----------|
| `/search?...` (with filters) | Noindex | Search filters are thin; visitor-specific | `/search?d={code}` or `/d/{code}` |
| `/search?sort=...` | Noindex | Sort is temporary visitor state | `/d/{code}` (same results) |
| `/search?first=...` | Noindex | Pagination; changes ranking | `/d/{code}` |
| `/search?page=2+` | Noindex | Pagination; duplicates page 1 | `/d/{code}` (page 1) |
| `/compare?a=...&b=...` | Noindex | Temporary comparison; not durable | None (informational) |
| `/posts?author={id}&category={code}` | Noindex | Author-scoped posts; practice-area click | `/practice/{code}` (with source boost) |
| `/posts?page=2+` | Noindex | Pagination | `/posts?author=...&category=...` (page 1) |
| `/account/bookmarks` | Noindex | User-specific; not public | None (must login) |
| `/account/*` (all login pages) | Noindex | Private user area | None (must login) |
| `/manage/*` (all editor pages) | Noindex | Admin area | None (must login) |
| `/admin/*` | Noindex | Admin backend | None (must login) |
| `/api/*` | Noindex | API; no rendering | None |
| `/404`, `/500` | Noindex | Error pages | Canonical to home or referring page |
| Premium on advocateid.in: `/{slug}` | Noindex | Canonical is custom domain | https://custom-domain.com/ |
| Premium post: `/post/{id}/{seo}` | Noindex | Canonical is custom domain: `/p/{id}/{seo}` | https://custom-domain.com/p/{id}/{seo} |

**Pattern:** Any page with query parameters (filters, sort, pagination) is noindex with a canonical to the cleanest version (usually without the parameter).

---

## 3. Canonical URL rules

### 3.1 Same-page canonicals

**If a page has multiple ways to reach it, pick ONE canonical.**

```html
<!-- /d/{code} and /search?d={code} are the same page -->
<!-- Both pages output: -->
<link rel="canonical" href="https://advocateid.in/d/{code}" />

<!-- /d/{code}/{cat}/{code} and /search?d={code}&cat={code} are the same -->
<link rel="canonical" href="https://advocateid.in/d/{code}/practice-area/{catcode}" />
```

### 3.2 Paginated canonicals

**Pagination pages (page 2, 3, ...) point to page 1:**

```html
<!-- /search?d={code}&page=2 -->
<link rel="canonical" href="https://advocateid.in/d/{code}?page=1" />

<!-- OR (if no pagination in URL): -->
<link rel="canonical" href="https://advocateid.in/d/{code}" />
```

### 3.3 Premium domain canonical

**On a custom domain, the custom domain is canonical (not advocateid.in):**

```html
<!-- On custom domain: https://example.com/ -->
<link rel="canonical" href="https://example.com/" />

<!-- On advocateid.in (noindex, hidden): https://advocateid.in/{slug} -->
<link rel="canonical" href="https://example.com/" />
<!-- OR if the page is unique to the domain: -->
<link rel="canonical" href="https://example.com/about" />
```

### 3.4 Wrong slug redirect

**If a visitor hits `/{id}/{wrong-seo}`, redirect 301 to the correct slug:**

```typescript
// In Next.js middleware or route handler:
async function handleProfileRoute(id: string, slug: string) {
  const page = await db.query.pages.findFirst({ where: { id } });
  
  if (page.slug !== slug) {
    // Wrong slug; redirect 301 to correct URL
    return redirect(`/${page.slug}`, 301);
  }
  
  // Correct slug; serve page with canonical
}
```

---

## 4. Language and hreflang

### 4.1 URL structure

**Language is in the URL path (not a subdomain or parameter):**

```
English: /
Malayalam: /ml/
```

**Any route has a language prefix:**
```
/                    → English home
/ml/                 → Malayalam home
/d/{code}            → English search by district
/ml/d/{code}         → Malayalam search by district
/c/{id}/{seo}        → English court page
/ml/c/{id}/{seo}     → Malayalam court page
/{slug}              → English profile
/ml/{slug}           → Malayalam profile
```

### 4.2 Hreflang links

**Every page includes `hreflang` links to alternate versions:**

```html
<!-- On /c/{id}/{seo} (English court page) -->
<link rel="alternate" hreflang="en" href="https://advocateid.in/c/{id}/{seo}" />
<link rel="alternate" hreflang="ml" href="https://advocateid.in/ml/c/{id}/{seo}" />
<link rel="alternate" hreflang="x-default" href="https://advocateid.in/c/{id}/{seo}" />

<!-- On /ml/c/{id}/{seo} (Malayalam court page) -->
<link rel="alternate" hreflang="en" href="https://advocateid.in/c/{id}/{seo}" />
<link rel="alternate" hreflang="ml" href="https://advocateid.in/ml/c/{id}/{seo}" />
<link rel="alternate" hreflang="x-default" href="https://advocateid.in/c/{id}/{seo}" />
```

**Rules:**
- Every language variant includes `hreflang` to all other languages.
- `x-default` points to English (the default for unknown users).
- `hreflang` is self-referential (English page links to itself in English hreflang).

### 4.3 No automatic language switching

**Do NOT redirect `/c/{id}/{seo}` to `/ml/c/{id}/{seo}` based on browser language.**

- Visitor from Kerala with Malayalam browser → stays on `/c/{id}/{seo}` (English).
- User sees hreflang links; can click `/ml/c/{id}/{seo}` manually.
- This avoids hreflang issues (Google can't tell if the user is a bot or human).

### 4.4 Malayalam content

**What's translated:**
- Court names (`court.name` vs `court.local_name`)
- Location names (`locality.name` vs `locality.local_name`)
- Practice area names (from translation files)
- Page content if user writes bio/about in Malayalam (rare, but possible)
- UI strings (buttons, labels, form fields)

**What's NOT translated (English only in MVP 1):**
- Slug (still a-z, digits, hyphen; always English)
- Enrolment number (numeric; language-agnostic)
- URLs (readable path in English; code-based filters)

---

## 5. Sitemap structure

### 5.1 Main sitemap

**File: `/sitemap.xml`** (gzip optional)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://advocateid.in/sitemaps/static-1.xml</loc>
    <lastmod>2025-01-01</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://advocateid.in/sitemaps/courts-1.xml</loc>
    <lastmod>2025-01-15</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://advocateid.in/sitemaps/profiles-1.xml</loc>
    <lastmod>2025-01-20</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://advocateid.in/sitemaps/posts-1.xml</loc>
    <lastmod>2025-01-18</lastmod>
  </sitemap>
</sitemapindex>
```

### 5.2 Static sitemap

**File: `/sitemaps/static-1.xml`** (home, info pages, never change)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://advocateid.in/</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://advocateid.in/" />
    <xhtml:link rel="alternate" hreflang="ml" href="https://advocateid.in/ml/" />
    <xhtml:link rel="alternate" hreflang="x-default" href="https://advocateid.in/" />
    <lastmod>2025-01-20</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://advocateid.in/about</loc>
    <lastmod>2025-01-20</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://advocateid.in/contact</loc>
    <lastmod>2025-01-20</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <!-- ... terms, privacy, grievance, etc. -->
</urlset>
```

### 5.3 Courts and locations sitemap

**File: `/sitemaps/courts-1.xml`** (regenerated daily)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://advocateid.in/c/kl-hc-001/high-court-of-kerala</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://advocateid.in/c/kl-hc-001/high-court-of-kerala" />
    <xhtml:link rel="alternate" hreflang="ml" href="https://advocateid.in/ml/c/kl-hc-001/high-court-of-kerala" />
    <lastmod>2025-01-20T10:00:00Z</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <!-- ... all courts -->
</urlset>
```

### 5.4 Profiles sitemap

**File: `/sitemaps/profiles-1.xml` (split into multiple files if > 50,000 URLs)**

```xml
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://advocateid.in/priya-sharma</loc>
    <lastmod>2025-01-20T10:00:00Z</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <!-- ... all pages (advocates and firms) -->
</urlset>
```

**Rules:**
- Only index pages with `status = 'active'` (not suspended or deleted).
- Only index Basic/Professional pages on advocateid.in (Premium pages are noindex).
- Premium pages get their own sitemap on the custom domain.

### 5.5 Premium domain sitemap

**File: `https://example.com/sitemap.xml`** (on the custom domain)

```xml
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://example.com/sitemaps/pages-1.xml</loc>
  </sitemap>
</sitemapindex>
```

**Content (for a firm domain):**
```xml
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2025-01-20T10:00:00Z</lastmod>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://example.com/posts</loc>
    <lastmod>2025-01-19T15:00:00Z</lastmod>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://example.com/p/{post-id}/post-title</loc>
    <lastmod>2025-01-18T10:00:00Z</lastmod>
    <priority>0.7</priority>
  </url>
  <!-- ... offices, lawyers, etc. -->
</urlset>
```

### 5.6 Sitemap generation logic

```typescript
// Nightly job: regenerate sitemaps
async function generateSitemaps() {
  // 1. Static sitemap (rarely changes)
  await generateStaticSitemap();
  
  // 2. Courts and locations sitemap
  const courts = await db.query.courts.findMany();
  await generateCourtsSitemap(courts);
  
  // 3. Profiles sitemap (split if > 50k)
  const pages = await db.query.pages.findMany({
    where: { status: 'active', deleted_at: null }
  });
  await generateProfilesSitemaps(pages);
  
  // 4. Posts sitemap
  const posts = await db.query.posts.findMany({
    where: { status: 'published', deleted_at: null }
  });
  await generatePostsSitemap(posts);
  
  // 5. For each premium domain, generate domain-specific sitemap
  const domains = await db.query.domains.findMany({
    where: { status: 'active' }
  });
  for (const domain of domains) {
    await generateDomainSitemap(domain);
  }
  
  console.log('Sitemaps regenerated');
}
```

---

## 6. Robots.txt

**File: `/robots.txt`**

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /account/
Disallow: /manage/
Disallow: /compare
Disallow: /search
Disallow: *?*=* # Disallow query parameters (filters, sort, pagination)

# Allow access to sitemaps
Allow: /sitemap.xml
Allow: /sitemaps/

Sitemap: https://advocateid.in/sitemap.xml

# Crawl delay (be nice to servers)
Crawl-delay: 1
```

**Custom domain robots.txt:** The domain owner can override if needed (via /manage/{pageId}/domain).

---

## 7. Meta tags implementation

### 7.1 Description meta tag

**Max 160 characters; pulled from bio (first 160 chars) or About.**

```typescript
function generateMetaDescription(page: Page): string {
  const text = page.bio || page.about || '';
  const cleaned = text.replace(/<[^>]*>/g, ''); // Remove HTML
  return cleaned.substring(0, 160).trim();
}
```

**In HTML:**
```html
<meta name="description" content="{metaDescription}" />
```

### 7.2 Open Graph (OG) tags

```html
<meta property="og:title" content="{pageTitle}" />
<meta property="og:description" content="{metaDescription}" />
<meta property="og:image" content="{imageUrl}" />
<meta property="og:url" content="{canonicalUrl}" />
<meta property="og:type" content="profile" /> <!-- for profiles -->
```

**Image:** for advocates/firms, use the profile photo; for posts, use the cover image.

### 7.3 Twitter Card

```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{pageTitle}" />
<meta name="twitter:description" content="{metaDescription}" />
<meta name="twitter:image" content="{imageUrl}" />
```

---

## 8. Noindex thin pages

**Pages with fewer than 3 advocates and NO court update are noindex:**

```typescript
async function shouldIndexSearchResult(districtId: string, categoryCode?: string) {
  const query = {
    where: {
      district_id: districtId,
      status: 'active',
      deleted_at: null,
    }
  };
  
  if (categoryCode) {
    query.where.categories = { some: { code: categoryCode } };
  }
  
  const advocates = await db.query.pages.findMany(query);
  const courtUpdates = await db.query.posts.findMany({
    where: {
      type: 'court_update',
      district_id: districtId,
      status: 'published',
    }
  });
  
  const isIndexable = advocates.length >= 3 || courtUpdates.length > 0;
  return isIndexable;
}
```

**If thin:** output `<meta name="robots" content="noindex, nofollow" />` and a canonical to a broader page.

---

## 9. Testing and validation

### 9.1 Manual checks

- [ ] Home page loads with correct meta description, OG tags.
- [ ] Court page has hreflang links to `/ml/c/...`.
- [ ] Search results (indexed) show in Google Search Console.
- [ ] `/compare` page is noindex with no canonical (informational).
- [ ] Login pages (`/account/login`) are noindex.
- [ ] `/sitemap.xml` returns 200 and is valid XML.
- [ ] Pagination pages (`?page=2`) are noindex with canonical to page 1.
- [ ] Premium page on advocateid.in is noindex with canonical to custom domain.

### 9.2 Google Search Console checks

- [ ] Sitemap submitted; all pages crawlable.
- [ ] No "blocked by robots.txt" errors.
- [ ] Core Web Vitals pass (LCP, FID, CLS).
- [ ] Mobile-friendly: pages responsive on phones.
- [ ] No indexing issues; coverage shows all expected pages.

### 9.3 Automated tests (Schema Validator)

```bash
# Validate JSON-LD schema
curl -X POST https://validator.schema.org/ -F url=https://advocateid.in/{slug}

# Check for common issues: missing title, broken hreflang, duplicate canonical
npm run test:seo
```

### 9.4 Lighthouse SEO audit

```bash
lighthouse https://advocateid.in/c/kl-hc-001/high-court-of-kerala --output=json
# Look for "SEO" section score > 90
```

---

## 10. SEO monitoring (MVP 2)

**Not in MVP 1, but document the plan:**

- **Google Search Console:** track impressions, clicks, average position, CTR per query.
- **Ranking tracker:** track keyword positions weekly.
- **Core Web Vitals:** monitor LCP, FID, CLS monthly.
- **Backlink monitoring:** track new links and referring domains.
- **Competitor analysis:** monitor competing directories' SEO performance.

---

## 11. Redirect map (301 redirects)

| Old URL | New URL | Status | Reason |
|---------|---------|--------|--------|
| `/search` | `/d/{user-district}` | Future | Redirect search landing page |
| `/{slug-old}` | `/{slug-new}` | 301 | Slug change; active for 12 months |
| `/user/{id}` | `/{slug}` | 301 | URL structure change (if it happens) |
| `/{slug-reserved}` | `/` | 410 Gone | Reserved slug; prevent re-use for 90 days |

**Retention:** old slug redirects for 12 months; reserved slug for 90 days (see section 6.3 in PROJECT_REQUIREMENTS_v6.md).

---

## 12. Checklist before launch

- [ ] All indexable pages have correct canonical.
- [ ] All noindex pages have canonical to a broader page.
- [ ] Hreflang links present on every page with /ml/ variant.
- [ ] JSON-LD schemas valid (Attorney, LegalService, Article, GovernmentOrganization, BreadcrumbList).
- [ ] Sitemap generated and submitted to Google Search Console.
- [ ] Robots.txt blocks /api/, /admin/, /account/, /manage/.
- [ ] Meta descriptions pulled from bio (160 chars, no banned words).
- [ ] OG tags complete (title, description, image, URL).
- [ ] Lighthouse SEO score > 90.
- [ ] Google Search Console shows no indexing issues.
- [ ] Premium domain canonical correct; advocateid.in marked noindex.
- [ ] Thin pages (< 3 advocates, no updates) are noindex.
- [ ] 301 redirects for old slugs active for 12 months.
- [ ] Language switching via URL (/ml/...), not auto-redirect.
