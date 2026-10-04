# /rules/analytics.md: Tracking, analytics, and DPDP compliance

*Records impressions, views, and Connect taps per host (advocateid.in vs custom domain). Implements rotating visitor IDs and DPDP-compliant consent for analytics.*

---

## 1. Event types and recording

### 1.1 Three core events

| Event | When | Data recorded | Retention | Use case |
|-------|------|---|---|---|
| **Impression** | Page appears in a list, search result, similar block, or post feed | `page_id`, `host`, `visitor_id`, `timestamp`, `context` (search, similar, feed) | 30 days raw; 1 year aggregate | Reach; how many times did this page show to visitors? |
| **View** | Page is opened (user navigates to `/{slug}` or `/post/{id}`) | `page_id`, `host`, `visitor_id`, `timestamp`, `referrer` | 30 days raw; 1 year aggregate | Traffic; how many unique visitors opened the page? |
| **Connect tap** | User clicks the Connect button (WhatsApp, call) | `page_id`, `host`, `visitor_id`, `timestamp`, `action` (whatsapp, call) | 30 days raw; 1 year aggregate | Engagement; how many people want to contact? |

### 1.2 Per-host recording

**Every event is recorded with the host:**

| Event | Host = advocateid.in | Host = custom domain | Separation |
|---|---|---|---|
| Impression | Counted on advocateid.in analytics | Counted on custom domain analytics | Owner sees separate numbers |
| View | Counted on advocateid.in | Counted on custom domain | Owner can compare traffic sources |
| Connect tap | Counted on advocateid.in | Counted on custom domain | Owner knows which domain drives leads |

**Why:** A Premium firm with a custom domain needs to know:
- "I got 100 views on advocateid.in and 200 views on my domain."
- Ranking uses numbers from both sources (no bias to either).

---

## 2. Raw data recording

### 2.1 Every load is recorded

**No filtering at recording time.** Even if the user is the owner or a bot, the event is recorded with a flag.

```typescript
async function recordView(pageId: string, visitorId: string, host: string) {
  await db.insert(page_events_raw).values({
    page_id: pageId,
    visitor_id: visitorId,
    host: host,
    event_type: 'view',
    is_owner: checkIfOwner(visitorId, pageId), // Flag; value 0 or 1
    is_bot: detectBot(request.userAgent), // Flag; value 0 or 1
    timestamp: new Date(),
  });
}
```

**Flags used later for ranking, not for excluding data at collection time.**

### 2.2 Raw data retention and purge

**30-day retention; purged nightly.**

```typescript
async function purgeOldRawEvents() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const deleted = await db.delete(page_events_raw)
    .where({ timestamp: { lt: thirtyDaysAgo } });
  
  console.log(`Purged ${deleted.rowCount} raw events older than 30 days`);
}
```

**Why:** Raw data is verbose (every single load); we don't need it forever. Aggregates (counts per day) are kept for 1 year (for owners and admin).

---

## 3. Aggregated data (ranking and admin)

### 3.1 Daily aggregates

**Nightly, roll up raw data into daily counts per page and host.**

```typescript
async function aggregateRawEvents() {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // For each page and host, sum the counts, excluding owner/bot loads
  const aggregates = await db.raw(`
    SELECT 
      page_id,
      host,
      DATE(timestamp) as day,
      COUNT(*) as impressions_raw,
      COALESCE(SUM(CASE WHEN event_type = 'view' AND is_owner = 0 AND is_bot = 0 THEN 1 ELSE 0 END), 0) as views,
      COALESCE(SUM(CASE WHEN event_type = 'connect' AND is_owner = 0 AND is_bot = 0 THEN 1 ELSE 0 END), 0) as connects
    FROM page_events_raw
    WHERE DATE(timestamp) = ?
    GROUP BY page_id, host, DATE(timestamp)
  `, [yesterday]);
  
  // Insert into aggregated table
  for (const agg of aggregates) {
    await db.insert(page_daily_events).values({
      page_id: agg.page_id,
      host: agg.host,
      day: agg.day,
      impressions: agg.impressions_raw, // Include raw; used elsewhere
      views: agg.views, // Cleaned
      connects: agg.connects, // Cleaned
      created_at: new Date(),
    });
  }
}
```

### 3.2 Data dictionary

**Table: `page_daily_events`**

| Column | Type | Example | Notes |
|--------|------|---------|-------|
| `id` | UUID | `evt_abc123` | Primary key |
| `page_id` | UUID | `page_456` | Which page? |
| `host` | String | `advocateid.in` or `example.com` | Which domain? |
| `day` | Date | `2025-01-20` | Which day? |
| `impressions` | Integer | `150` | Raw count (all loads) |
| `views` | Integer | `100` | Cleaned (owner/bot filtered) |
| `connects` | Integer | `8` | Cleaned (owner/bot filtered) |
| `created_at` | DateTime | `2025-01-21T00:15:00Z` | When aggregated |

---

## 4. Visitor identification (rotating random ID)

### 4.1 Rotating visitor ID (non-identifiable)

**Every visitor (not logged in) gets a random ID that changes daily.**

```typescript
function getVisitorId(request: Request): string {
  let id = getCookie(request, 'visitor_id');
  let date = getCookie(request, 'visitor_id_date');
  
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  if (!id || date !== today) {
    // Generate a new UUID for the day
    id = crypto.randomUUID();
    setCookie('visitor_id', id, { maxAge: 24 * 60 * 60 }); // 24 hours
    setCookie('visitor_id_date', today, { maxAge: 24 * 60 * 60 });
  }
  
  return id; // e.g., "550e8400-e29b-41d4-a716-446655440000"
}
```

**Why rotating?** Every day, the visitor gets a new ID. This prevents tracking the same person across weeks/months (privacy-preserving). The ID is random, not tied to name, mobile, or IP address.

**Logged-in users:** use their account ID (not rotating). They're identified anyway; this is normal analytics.

### 4.2 What NOT to pair with visitor ID

- ✗ Do NOT merge `visitor_id` with the visitor's mobile number.
- ✗ Do NOT merge `visitor_id` with IP address.
- ✗ Do NOT use persistent device IDs.
- ✗ Do NOT fingerprint browser (font list, canvas fingerprint, etc.).

**This keeps visitors anonymous at the database level.**

---

## 5. Analytics tools (MVP 1 and beyond)

### 5.1 Own counters (MVP 1)

**Database tables: `page_daily_events`, `page_scores`.**

**Use for:**
- Admin dashboard: total impressions, views, connects per page, per district.
- Ranking: quality score based on engagement.
- Owner dashboard (MVP 2): "Your page got 10 views yesterday."

**No external service; data stays in our database.**

### 5.2 Cloudflare Analytics (MVP 1)

**Hosted by Cloudflare; included with Workers.**

**Use for:**
- Per-hostname traffic (advocateid.in vs custom domains).
- Geographic distribution (which countries/states visit).
- Traffic sources (referrer analysis).
- Response times and errors.

**Coverage by Cloudflare DPA; no additional consent needed (infrastructure analytics).**

### 5.3 Google Search Console (MVP 1)

**Free Google tool for SEO monitoring.**

**Use for:**
- Search impressions and clicks.
- Average position for keywords.
- Indexing status (any crawl errors).
- Mobile usability.

**Coverage: Google's privacy policy. No PII collected.**

### 5.4 Google Analytics 4 (MVP 2, optional, requires consent)

**Not in MVP 1. If used in MVP 2+:**

- Requires explicit opt-in via consent banner.
- Stores IP address, device ID, user ID (if logged in).
- Qualifies as "non-essential" under DPDP; needs consent.
- Consent banner on every page (not in MVP 1 since we don't use GA4).

**Alternative:** use Cloudflare + own database counters. They are sufficient.

### 5.5 NO Hotjar or session replay (MVP 1 and MVP 2)

**Out of scope for now.** Session replay records user interactions (mouse, keyboard, form inputs), which is too invasive and requires explicit consent under DPDP.

---

## 6. DPDP compliance for analytics

### 6.1 Consent strategy

**Strictly necessary cookies (enabled by default):**
- `visitor_id`: rotating random ID for analytics (non-identifiable; no consent needed).
- `session_id`: login state (essential; no consent needed).
- `bookmarks`: saved pages (essential; no consent needed).
- `language`: UI language (essential; no consent needed).

**Non-essential analytics:**
- Google Analytics 4 (future): requires explicit consent.
- Any third-party tracking script: requires explicit consent.

**Implementation:**
```typescript
// Default: essential cookies only. No banner.
// Non-essential (if used): show banner, default deny.

async function handleAnalyticsConsent(request: Request) {
  const consentedGA4 = getCookie(request, 'consent_ga4');
  
  if (consentedGA4 === 'true') {
    // Load GA4 script only if consented
    injectGA4Script();
  }
  // Otherwise: no GA4 tracking
}
```

### 6.2 Consent banner (for GA4, MVP 2)

**Only if using GA4. In MVP 1, no banner (Cloudflare analytics doesn't require consent).**

```html
<div id="analytics-consent-banner">
  <p>This site uses analytics to understand how you use it.</p>
  <label>
    <input type="checkbox" id="consent-ga4" />
    Allow Google Analytics (optional)
  </label>
  <button onclick="acceptAnalytics()">Accept</button>
  <button onclick="rejectAnalytics()">Reject</button>
  <a href="/privacy">Learn more</a>
</div>
```

**Save consent:**
```typescript
function acceptAnalytics() {
  setCookie('consent_ga4', 'true', { maxAge: 365 * 24 * 60 * 60 });
  injectGA4Script();
  closeBanner();
}

function rejectAnalytics() {
  setCookie('consent_ga4', 'false', { maxAge: 365 * 24 * 60 * 60 });
  closeBanner();
}
```

### 6.3 IP address handling

**Rule: Never store full IP addresses in analytics tables.**

✓ **OK:**
```typescript
// Hashing the IP (one-way) for rate-limiting
const ipHash = crypto.createHash('sha256').update(ipAddress).digest('hex');
await db.insert(rate_limits).values({ ip_hash: ipHash, attempts: 1 });
```

✗ **NOT OK:**
```typescript
// Storing full IP for analytics tracking
await db.insert(page_views).values({ 
  page_id, 
  ip_address: '192.168.1.1', // ❌ Never store
  timestamp,
});
```

**Cloudflare:** handles IP addresses per its privacy policy (acceptable; they're a processor).

---

## 7. Ranking data (cleaned, not displayed)

### 7.1 Ranking calculation

**Uses aggregated, cleaned data (owner/bot filtered).**

```typescript
async function calculatePageScore(pageId: string) {
  // Get last 12 months of cleaned events
  const events = await db.query.page_daily_events.findMany({
    where: {
      page_id: pageId,
      day: { gte: oneYearAgo },
    }
  });
  
  const totalViews = events.reduce((sum, e) => sum + e.views, 0);
  const totalConnects = events.reduce((sum, e) => sum + e.connects, 0);
  
  // Engagement: compare with district average
  const districtAvg = await db.raw(`
    SELECT AVG(views) as avg_views
    FROM page_daily_events
    WHERE page_id IN (SELECT id FROM pages WHERE district_id = ?)
    AND day >= ?
  `, [page.district_id, oneYearAgo]);
  
  const engagementScore = totalViews > 0
    ? Math.min((totalViews / districtAvg.avg_views) * 20, 20)
    : 0;
  
  // Store the score (used for ranking only)
  await db.insert(page_scores).values({
    page_id: pageId,
    engagement_score: engagementScore,
    quality_score: engagementScore + completenessScore + contentScore + ...
    updated_at: new Date(),
  });
}
```

### 7.2 Score NOT displayed

**Rule: Never show the score or plan to visitors.**

✓ **Allowed:**
```html
<p>Sorted by relevance, nearest, most experienced, newest</p>
```

✗ **NOT allowed:**
```html
<p>Relevance score: 87</p>
<p>Plan: Professional</p>
<span class="rank-badge">Top advocate</span>
```

---

## 8. Event recording examples

### 8.1 Recording an impression (search result)

```typescript
async function recordSearchResultImpression(pageId: string, host: string, visitorId: string) {
  await db.insert(page_events_raw).values({
    page_id: pageId,
    host: host,
    visitor_id: visitorId,
    event_type: 'impression',
    context: 'search', // Where was it shown? (search, similar, feed, etc.)
    is_owner: checkIfOwner(visitorId, pageId),
    is_bot: detectBot(request.userAgent),
    timestamp: new Date(),
  });
}
```

### 8.2 Recording a view (page open)

```typescript
export default async function AdvocatePage({ params }) {
  const { slug } = params;
  const page = await getPage(slug);
  const visitorId = getVisitorId(request);
  const host = request.headers.get('host'); // advocateid.in or example.com
  
  // Record the view
  await recordView(page.id, visitorId, host);
  
  return <Profile page={page} />;
}

async function recordView(pageId: string, visitorId: string, host: string) {
  await db.insert(page_events_raw).values({
    page_id: pageId,
    host: host,
    visitor_id: visitorId,
    event_type: 'view',
    is_owner: checkIfOwner(visitorId, pageId),
    is_bot: detectBot(request.userAgent),
    timestamp: new Date(),
  });
}
```

### 8.3 Recording a Connect tap

```typescript
async function handleConnectClick(pageId: string, actionType: 'whatsapp' | 'call') {
  const visitorId = getVisitorId();
  const host = window.location.hostname; // advocateid.in or custom domain
  
  // Record the tap
  await fetch('/api/events/connect', {
    method: 'POST',
    body: JSON.stringify({
      page_id: pageId,
      host: host,
      visitor_id: visitorId,
      action_type: actionType,
    })
  });
  
  // Open WhatsApp or call
  if (actionType === 'whatsapp') {
    window.open(`https://wa.me/${phone}`);
  } else {
    window.location.href = `tel:${phone}`;
  }
}

// API endpoint
export async function POST(request: Request) {
  const { page_id, host, visitor_id, action_type } = await request.json();
  
  await db.insert(page_events_raw).values({
    page_id,
    host,
    visitor_id,
    event_type: 'connect',
    action: action_type,
    is_owner: checkIfOwner(visitor_id, page_id),
    is_bot: detectBot(request.headers.get('user-agent')),
    timestamp: new Date(),
  });
  
  return { ok: true };
}
```

---

## 9. Bot detection

### 9.1 Simple bot detection

```typescript
function detectBot(userAgent: string): boolean {
  const botPatterns = [
    'googlebot',
    'bingbot',
    'slurp',
    'duckduckbot',
    'baiduspider',
    'yandexbot',
    'crawler',
    'robot',
    'spider',
  ];
  
  const ua = userAgent.toLowerCase();
  return botPatterns.some(pattern => ua.includes(pattern));
}
```

### 9.2 Owner detection

```typescript
function checkIfOwner(visitorId: string, pageId: string): boolean {
  // If visitor is logged in and owns this page, flag it
  const account = getCurrentAccount(); // From session
  const page = getPage(pageId);
  
  return account?.id === page.account_id;
}
```

**Why flag instead of exclude?** Raw data includes owner views (for audit and debug). Ranking filters them out. Transparency.

---

## 10. Owner dashboard (MVP 2)

**Not in MVP 1. Plan for MVP 2:**

```
Owner opens /manage/{pageId}/analytics

Shows:
- Last 30 days: impressions, views, connects (separate counts for advocateid.in and custom domain)
- Weekly graph: views over time
- Top referring sources (search, direct, social, etc.)
- Top referrers (which pages link here)
- Geography: which districts/states view the page
- Devices: desktop vs mobile

Data pulled from page_daily_events (1-year retention).
```

---

## 11. Admin analytics dashboard (MVP 1)

**Simple views:**

```
Admin opens /admin/analytics

Shows:
- Total pages: {count}
- Total views (all time): {count}
- Total connects (all time): {count}
- Pages by district: {district} → {page_count}
- Top pages (by views): {page} → {views}

Data pulled from page_daily_events.
```

---

## 12. Compliance checklist

- [ ] Rotating visitor ID implemented and tested (changes daily).
- [ ] No full IP addresses stored in analytics tables.
- [ ] Every event recorded with `is_owner` and `is_bot` flags (not filtered at collection).
- [ ] Raw data purged after 30 days; aggregates kept 1 year.
- [ ] Ranking uses cleaned data (filtered); raw data used only for audit.
- [ ] Score and plan never displayed to visitors.
- [ ] Consent banner ready for GA4 (MVP 2); not used in MVP 1.
- [ ] Privacy policy updated: which tools, what data, retention.
- [ ] DPDP consent recorded in `account_consents` table.
- [ ] Counsel review of analytics DPDP compliance (T6).

---

## 13. Tools comparison

| Aspect | Own counters | Cloudflare Analytics | Google Search Console | GA4 (future) |
|--------|---|---|---|---|
| **Cost** | Included (DB cost) | Included | Free | Free (but data processing) |
| **Latency** | Immediate | Real-time | 24–48 hours | Real-time |
| **Detail** | Per-page, per-day | Per-domain traffic | Keywords, CTR | Full user journey |
| **DPDP consent** | Rotating ID (no consent) | Minimal (infrastructure) | Minimal (SEO) | YES (non-essential) |
| **Retention** | 1 year | 30 days | Indefinite | 14 months (default) |
| **Admin access** | Own app | Cloudflare dashboard | Google account | Google account |
| **Use case** | Ranking, owner dashboard | Traffic monitoring, debugging | SEO troubleshooting | User behaviour (MVP 3+) |

**Recommendation:** Own counters + Cloudflare is sufficient for MVP 1. Add GA4 in MVP 2 if needed (with consent).

---

## 14. Testing

### 14.1 Record events locally

```bash
# Open http://localhost:3000/{slug} in two browsers:
# Browser 1: Normal visitor
# Browser 2: Same device, different user (new cookie)

# Check database:
SELECT * FROM page_events_raw
WHERE page_id = '{slug}' AND created_at > NOW() - INTERVAL '1 hour';

# Should see:
# - Browser 1: visitor_id = same all day
# - Browser 2: visitor_id = different (new)
# - Both: is_owner = 0 (unless logged in as owner)
```

### 14.2 Rotation test

```bash
# Wait until midnight UTC; reload page
# Check database:
SELECT * FROM page_events_raw WHERE visitor_id = '{id}';

# Before midnight: all events have same visitor_id
# After midnight: new visitor_id for the day
```

### 14.3 Aggregation test

```bash
# After nightly purge job:
SELECT * FROM page_daily_events WHERE day = CURDATE() - INTERVAL '1 day';

# Should see:
# - impressions: raw count (includes owner/bot)
# - views: cleaned count (owner/bot excluded)
# - connects: cleaned count
```

---

## 15. Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Visitor ID same across days | Rotation logic broken | Check cookie expiry; force clear after midnight |
| Owner views showing in ranking | is_owner flag not set | Verify checkIfOwner() logic |
| Data not aggregated | Nightly job failed | Check logs; re-run manually |
| GA4 not tracking (MVP 2) | Consent not given | Check consent banner; verify script injection |
| Cloudflare not recording | Workers not capturing | Check request headers in /api/ |
