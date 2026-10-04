# /rules/dpdp-checklist.md: DPDP Act 2023 and Rules 2025 implementation

*Covers all 12 non-negotiable rules from AGENTS.md section 2. Detailed, table by table, with code examples and test cases. Not legal advice. Counsel review required (T6).*

---

## 0. Phases and timeline

| Phase | Date | What | Status |
|-------|------|------|--------|
| Rules notified | 13 Nov 2025 | DPDP Rules 2025 published | ✓ Done |
| Phase 1 | 13 Nov 2025 – ~13 May 2026 | Grace period; no enforcement | Current |
| Phase 2 | ~13 May 2026 – ~13 May 2027 | Consent, notice, processor list, audit trail required | Prepare now |
| Phase 3 | ~13 May 2027 + | All duties enforceable; Data Protection Board active | **Main duties commence** |

**Founder decision:** comply strictly from day one (Nov 2025). Counsel must confirm these dates and obligations (T6).

---

## 1. Personal data definition and inventory

**DPDP Act § 3(c): "personal data" means any information relating to an individual.**

**In this product, personal data includes:**

| Data type | Examples | Table(s) | Sensitivity |
|-----------|----------|---------|-------------|
| Mobile number | Login number, office phone, OTP delivery | `accounts.mobile`, `offices.phone` | HIGH |
| OTP logs | One-time passwords, timestamps, attempts | `otp_logs` | HIGH |
| Names | Page owner, lawyer names, user names | `pages.name`, `memberships.intro`, `posts.author` | MEDIUM |
| Photos | Profile pictures, banner images, office photos | `pages.photo_key`, `offices.photo_key`, `memberships.photo_key` | MEDIUM |
| Enrolment numbers | Advocate registration ID, bar council membership | `page_advocate.enrolment_no` | HIGH (public by law) |
| Addresses | Office addresses, registered addresses | `offices.address`, `offices.locality_id` | MEDIUM |
| Job details | Title, firm, position history | `memberships.title`, `career_entries` | MEDIUM |
| Contact details | Phone, email (future), WhatsApp | `offices.phone`, contact form submissions | MEDIUM |
| IP addresses | Visitor IP during OTP, form submission | (never stored; see section 4) | MEDIUM |
| Device IDs | Local storage, service worker state | (anonymous; see section 4) | LOW |
| Visitor IDs | Rotating random ID for analytics | `page_daily_events.host` | LOW (non-identifiable) |
| Bookmarks | Pages a visitor saved | `cookies` (before login), `bookmarks` (after) | LOW |
| Slugs and URLs | Short profile handles | `pages.slug`, `slug_history` | LOW |

**Action:** For each table, document:
1. What personal data it holds.
2. Why it's collected (purpose).
3. How long it's kept (retention).
4. Who accesses it (processors, admins).
5. How it's deleted (purge job).

---

## 2. Notice and consent

**DPDP Act § 5–8; Rules § 5–6: Before collecting personal data, tell the individual what, why, how long, and their rights. Consent must be specific, free, and withdrawable. No bundled or pre-ticked consent.**

### 2.1 Privacy notice (before data collection)

**What to tell them:**

```
Advocate ID Privacy Notice

We collect the following personal data:

1. Mobile number: for login and contact via WhatsApp/call.
   Retained for: duration of account + 30 days after deletion.
   Processor: [SMS/OTP provider], Cloudflare (storage).

2. OTP logs: to authenticate login attempts.
   Retained for: 7 days (deleted daily after 7 days).
   Processor: [OTP provider].

3. Profile information (name, enrolment, bio, photo): to publish your public page.
   Retained for: duration of page + 30 days after deletion.
   Processor: Cloudflare (storage, edge cache).

4. Office phone number (if different from login): for Contact button on your office page.
   Retained for: duration of page + 30 days after deletion.
   Processor: [OTP provider] (optional verification), Cloudflare.

5. Visitor analytics (impressions, views, Connect taps): to rank your page and show analytics.
   Retained for: 1 year (daily aggregates; raw data purged nightly for visitors).
   Processor: own database, Cloudflare analytics.

Your rights:
- Download your data: /account/download
- Correct or update: /manage/{pageId}
- Delete your account: /account/settings > Delete account
- Withdraw consent: /account/settings > Manage cookies
- Lodge a grievance: /grievance

For more: /privacy
```

### 2.2 Consent form (at signup and before collecting sensitive data)

**Checkpoint 1: Mobile login (mandatory consent)**

```
☐ I consent to Advocate ID storing my mobile number and using it for:
   - OTP-based login
   - Contact for account and service updates
   - Reaching me via WhatsApp or call (with my explicit request)
   
I understand my number is retained for the duration of my account and 30 days after 
deletion. I can withdraw this consent at any time in /account/settings.
```

**Checkpoint 2: Office phone (optional)**

```
☐ I consent to adding a different phone number for my office and displaying it 
on my office page so visitors can call.

I understand this number will be verified via OTP and shown publicly. 
I can change or delete it anytime in /manage/{pageId}/offices.
```

**Checkpoint 3: Analytics (for visitors; MVP 2)**

```
☐ I consent to Advocate ID using cookies and analytics to:
   - Count views and impressions on my page
   - Improve the platform

Strictly necessary cookies (session, bookmarks, compare) are always enabled. 
Non-essential analytics cookies require your consent.

[Allow analytics] [Reject]
```

**Checkpoint 4: Advanced analytics (GA4; MVP 2+, if opted)**

```
☐ I consent to Google Analytics 4 tracking my usage to help the team improve the platform.

GA4 may store your IP address and device ID. Learn more in /privacy.

[Allow GA4] [Reject]
```

### 2.3 Implementation checklist

- [ ] Privacy notice placed before every signup and major data collection (mobile, office phone, photo upload).
- [ ] Consent is explicit (checkbox, not pre-ticked).
- [ ] Consent is specific (one checkbox per purpose; not bundled).
- [ ] Consent is withdrawable (user can opt out in /account/settings).
- [ ] Audit log records every consent and withdrawal with timestamp.
- [ ] Consent stored in `account_consents` table with `account_id`, `type`, `consented_at`, `withdrawn_at`, `ip_address` (hashed).

---

## 3. Purpose limit and data minimisation

**DPDP Act § 4: Collect only what a feature needs. Do not reuse data for a new purpose without new consent.**

### 3.1 Purpose mapping

| Data | Primary purpose | Secondary use? | Needs consent? |
|------|-----------------|---|---|
| Mobile number (login) | Authentication | SMS/OTP delivery to same number | No (same purpose) |
| Mobile number (login) | Authentication | Marketing SMS (e.g., "Your page got 10 views") | **YES, separate** |
| Profile name | Public page display | Admin moderation (finding duplicates) | No (same purpose: publication) |
| Profile photo | Public page display | Analytics (profile completeness score) | No (same purpose) |
| Office phone | Contact button display | Ranking (active offices boost score) | No (same purpose: publication) |
| Enrolment number | Public page display | Verify with bar council (future) | **YES, separate** |
| Visitor IP | Rate-limit OTP attempts | Store in analytics | **NO—never store** |

**Action:** For every table with personal data, document the primary purpose and list any secondary uses. If secondary, add a new consent checkpoint.

### 3.2 Code example: strict minimisation

```typescript
// ✓ GOOD: Collect only the mobile number for login
async function handleOTPSignup(mobile: string) {
  // Validate format
  if (!/^\+91\d{10}$/.test(mobile)) throw new Error("Invalid format");
  
  // Collect ONLY the mobile and timestamp
  await db.insert(accounts).values({
    mobile: hashPhoneForDuplicateCheck(mobile), // Only hash for uniqueness; store encrypted
    created_at: new Date(),
    status: 'pending',
    // Do NOT collect: name, email, device ID, IP address here
  });
}

// ✓ GOOD: Separate consent for marketing SMS
async function sendMarketingSMS(accountId: string) {
  const account = await db.query.accounts.findFirst({ where: { id: accountId } });
  const consent = await db.query.account_consents.findFirst({
    where: { account_id: accountId, type: 'marketing_sms' }
  });
  
  if (!consent?.consented_at) {
    throw new Error("Consent required; show the user a banner");
  }
  
  // Send SMS only if consented
  await sendSMS(account.mobile, message);
}

// ✗ BAD: Collecting extra data without consent
async function handleOTPSignup(mobile: string, name: string, email: string, deviceId: string, ipAddress: string) {
  // Overreach; minimal consent only covers mobile for login, not name/email/device
  await db.insert(accounts).values({
    mobile, name, email, device_id: deviceId, ip_address: ipAddress, // All stored unnecessarily
    created_at: new Date(),
  });
}
```

---

## 4. Visitor tracking rules (no advertising, essential cookies only)

**DPDP Act § 8(2); Rules § 5(3): For visitors (not logged in), collect only essentials. No cross-site tracking. Analytics use a rotating random ID.**

### 4.1 Essential cookies (default enabled)

| Cookie | Purpose | Retention | Example |
|--------|---------|-----------|---------|
| `session_id` | Session state (login, temp data) | Until browser closes or 30 days | `sessionStorage` |
| `bookmarks` | Saved pages (before login) | 1 year | Locally stored JSON array |
| `compare_list` | Compare page items | Session | Locally stored JSON array |
| `language` | UI language choice (e.g., `/ml/...` → `lang=ml`) | 1 year | `localStorage` |

**These require NO consent banner.**

### 4.2 Non-essential cookies (opt-in)

| Cookie | Purpose | Vendor | Retention | Needs consent |
|--------|---------|--------|-----------|---|
| `visitor_id` | Rotating random ID for analytics (not PII) | Own database | Daily rotation | NO (non-identifiable) |
| Google Analytics (GA4) | Traffic analysis, user behaviour | Google | Per GA4 settings | **YES** |
| Hotjar | Session replay (NOT in MVP 1) | Hotjar | Per Hotjar settings | **YES** |

**Implementation:**
```typescript
// ✓ Rotating visitor ID (changes daily, non-identifiable)
// On every page load:
function getVisitorId(): string {
  let id = localStorage.getItem('visitor_id');
  let date = localStorage.getItem('visitor_id_date');
  
  if (!id || date !== today) {
    // Generate new random ID daily
    id = crypto.randomUUID();
    localStorage.setItem('visitor_id', id);
    localStorage.setItem('visitor_id_date', today);
  }
  
  return id; // Use this for analytics, never pair with IP or device
}

// ✓ Record impression/view with the rotating ID
async function recordView(pageId: string) {
  const visitorId = getVisitorId(); // Changes daily
  await db.insert(page_daily_events).values({
    page_id: pageId,
    host: 'advocateid.in',
    visitor_id: visitorId, // Anonymous, rotating
    event_type: 'view',
    created_at: new Date(),
  });
}
```

### 4.3 What NOT to do

- ✗ Store full IP address in analytics tables.
- ✗ Cross-site tracking (e.g., pixels on other sites).
- ✗ Advertising or retargeting cookies without consent.
- ✗ Device fingerprinting (MAC address, device ID, browser fingerprint).
- ✗ Merge visitor_id with name or mobile number.

---

## 5. Children protection (no tracking or targeting under-18)

**DPDP Act § 4(4); Rules § 7: Do not build features that track or target under-18 users. No profiling.**

### 5.1 Rules

- No age detection or age-gated features (e.g., "Law students" section).
- No child-targeted content (e.g., "Internship finder").
- No profiling by viewing history or interests.
- If a user self-identifies as a minor, do not store that fact.
- No persistent tracking of minors (rotating visitor ID is OK; persistent device ID is not).

### 5.2 Implementation

```typescript
// If a user indicates they are under 18 during signup (future feature):
async function handleAgeDisclosure(accountId: string, ageGroup: 'under_18' | '18_above') {
  if (ageGroup === 'under_18') {
    // Do NOT store this. Just show an age-appropriate page.
    // Log it nowhere; no tracking.
    return {
      message: "This directory is for registered advocates. If you're a law student interested in legal careers, please return once you're admitted to the bar.",
    };
  }
}
```

---

## 6. Rights: download, correct, delete, grievance

**DPDP Act § 9–11; Rules § 8–9: Product must support download, correction, and deletion. Grievance route `/grievance` exists.**

### 6.1 Download my data (`/account/download`)

**Endpoint:** `GET /api/account/download/{accountId}` (authenticated)

**Returns:** JSON or CSV with all personal data associated with the account.

```json
{
  "account": {
    "id": "acc_123",
    "mobile": "+91 XXXX XXXX XX",
    "created_at": "2025-01-15T10:00:00Z",
    "status": "active"
  },
  "pages": [
    {
      "id": "page_1",
      "slug": "priya-sharma",
      "name": "Priya Sharma",
      "bio": "...",
      "photo_url": "https://...",
      "created_at": "...",
      "updated_at": "..."
    }
  ],
  "consents": [
    {
      "type": "login_mobile",
      "consented_at": "2025-01-15T10:00:00Z",
      "withdrawn_at": null
    }
  ],
  "bookmarks": [
    {
      "page_id": "page_456",
      "saved_at": "2025-02-01T12:00:00Z"
    }
  ],
  "events": [
    {
      "page_id": "page_1",
      "event_type": "view",
      "count": 45,
      "period": "2025-02"
    }
  ]
}
```

### 6.2 Correct or update (`/manage/{pageId}` and `/account/settings`)

**Current pages:** live editor allows edit of all fields (name, bio, photo, etc.).

**Settings:** allow change of mobile number (with OTP verification) and deletion of old passwords/OTP logs.

```typescript
async function updatePageField(pageId: string, field: 'name' | 'bio' | 'photo', value: string) {
  // Audit log: record the change
  await db.insert(audit_log).values({
    action: 'page_field_updated',
    page_id: pageId,
    field,
    old_value: (await db.query.pages.findFirst({ where: { id: pageId } }))[field],
    new_value: value,
    actor: 'page_owner',
    timestamp: new Date(),
  });
  
  // Update
  await db.update(pages).set({ [field]: value }).where({ id: pageId });
}
```

### 6.3 Delete account (`/account/settings > Delete account`)

**Process:**

1. **Soft delete:** Set `deleted_at` timestamp on the account and all related pages.
2. **Grace period:** 30 days. During this time, the account owner can restore by visiting `/account`.
3. **Purge:** After 30 days, run a nightly job to hard-delete:
   - Personal data from `accounts`, `memberships`, `offices`, `contact_form_submissions`.
   - Pages remain in `pages` table but are unpublished (`deleted_at` set, not visible).
   - OTP logs purged immediately.
   - Bookmarks, consents, and audit logs purged.

```typescript
// Soft delete on user request
async function requestAccountDeletion(accountId: string) {
  await db.update(accounts).set({
    deleted_at: new Date(),
    status: 'deleted',
  }).where({ id: accountId });
  
  // All pages of this account are also soft-deleted
  await db.update(pages).set({
    deleted_at: new Date(),
  }).where({ account_id: accountId });
}

// Hard purge job (runs nightly, after 30 days)
async function purgeDeletedAccounts() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const accountsToPurge = await db.query.accounts.findMany({
    where: {
      deleted_at: { lt: thirtyDaysAgo },
    }
  });
  
  for (const account of accountsToPurge) {
    // Delete personal data
    await db.delete(accounts).where({ id: account.id });
    await db.delete(account_consents).where({ account_id: account.id });
    await db.delete(bookmarks).where({ account_id: account.id });
    await db.delete(otp_logs).where({ mobile: account.mobile }); // Already purged, but be sure
    
    console.log(`Purged account ${account.id}`);
  }
}
```

### 6.4 Grievance route (`/grievance`)

**Page:** `/grievance` (public, no login required)

**Form:**
```
Your name: [text]
Your email or mobile: [text]
Subject: [dropdown: Data access, Correction, Deletion, Breach report, Other]
Message: [textarea, max 5000 chars]
Attachment: [optional file upload]

[Submit]
```

**Process:**
1. Submit creates a `grievance` record with `status: 'open'`.
2. Grievance ID sent to the user's email/SMS.
3. Internal team investigates within 7 days (per DPDP Rules).
4. Response sent to the user with resolution or next steps.

```typescript
async function createGrievance(data: {
  name: string;
  contact: string; // email or mobile
  subject: string;
  message: string;
  attachment_url?: string;
}) {
  const grievanceId = `grvnc_${randomId()}`;
  
  await db.insert(grievances).values({
    id: grievanceId,
    name: data.name,
    contact: encryptSensitive(data.contact),
    subject: data.subject,
    message: data.message,
    attachment_url: data.attachment_url,
    status: 'open',
    created_at: new Date(),
  });
  
  // Send acknowledgement
  await sendSMS(
    data.contact,
    `Your grievance ID is ${grievanceId}. We'll respond within 7 days.`
  );
  
  return { grievanceId };
}
```

---

## 7. Retention and purge jobs

**DPDP Act § 6; Rules § 11: Every table holding personal data must have a documented retention period and a purge job.**

### 7.1 Retention by table

| Table | Personal data | Retention period | Purge job | Notes |
|-------|---|---|---|---|
| `accounts` | mobile, status, consents | Duration + 30 days after soft delete | Nightly, hard-delete after 30 days | See section 6.3 |
| `otp_logs` | mobile, OTP hash, attempt count | 7 days | Nightly (delete rows older than 7 days) | Never store plaintext OTP |
| `pages` | name, photo_key, bio, about | Duration of page + 30 days after soft delete | Soft-delete on request; hard-delete after 30 days | Photos stored in R2, delete files too |
| `offices` | phone, address, about | Duration of page + 30 days | Linked to page deletion | Delete office records if page deleted |
| `page_photos` | R2 key, filename | Duration + 30 days | Nightly job deletes R2 files | Use R2 object metadata (expiration) |
| `page_daily_events` (raw) | visitor_id, page_id, host | 30 days | Nightly: delete rows older than 30 days | Aggregated to `page_daily_events` (1-year retention) |
| `page_daily_events` (daily aggregate) | page_id, host, impressions, views, connects | 1 year | Nightly: delete aggregates older than 1 year | Used for ranking and owner dashboard (MVP 2+) |
| `account_consents` | type, consented_at, withdrawn_at | 3 years (audit trail) | Nightly (purge log after 3 years if account deleted) | Compliance audit trail |
| `audit_log` (admin actions) | action, actor, timestamp | 1 year | Nightly | Delete old logs after 1 year |
| `bookmarks` (logged-in users) | account_id, page_id | Duration of account + 90 days | Nightly after account deletion | Also merge with cookie bookmarks at login |
| `contact_form_submissions` | email/mobile, message | 90 days | Nightly: delete submissions older than 90 days | Support contact; no long-term retention |
| `grievances` | name, contact, message | 3 years | Nightly (auto-purge resolved grievances after 3 years) | Legal hold if under investigation |
| `slug_history` | old_slug, new_slug, page_id | Duration of page + 90 days (reserved) | Nightly after page purge | Reserved slugs prevent re-use for 90 days |

### 7.2 Purge job examples

**Purge OTP logs (7-day retention):**
```typescript
async function purgeOldOTPLogs() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const deleted = await db.delete(otp_logs)
    .where({ created_at: { lt: sevenDaysAgo } })
    .returning();
  
  console.log(`Purged ${deleted.length} old OTP logs`);
}
```

**Purge old page events (30-day raw, 1-year aggregate):**
```typescript
async function purgeOldPageEvents() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  
  // Delete raw data older than 30 days
  await db.delete(page_daily_events_raw)
    .where({ created_at: { lt: thirtyDaysAgo } });
  
  // Delete aggregates older than 1 year
  await db.delete(page_daily_events)
    .where({ day: { lt: oneYearAgo } });
  
  console.log('Purged old page events');
}
```

**Purge old R2 images:**
```typescript
async function purgeOldR2Images() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  // Find all deleted page images
  const deletedImages = await db.query.page_photos.findMany({
    where: {
      page_deleted_at: { lt: thirtyDaysAgo },
    }
  });
  
  for (const img of deletedImages) {
    // Delete from R2
    await r2.delete(img.r2_key);
    
    // Mark as purged in DB
    await db.delete(page_photos).where({ id: img.id });
  }
}
```

---

## 8. Security: encryption, secrets, rate-limiting, audit log

**DPDP Act § 10; Rules § 11: Encrypt in transit, store secrets in Cloudflare, hash OTPs, rate-limit endpoints, least-privilege access, audit log for admin actions.**

### 8.1 Encryption in transit

- **HTTPS only:** all traffic encrypted with TLS 1.3.
- **HSTS:** set `Strict-Transport-Security: max-age=31536000; includeSubDomains`.

```typescript
// In Next.js middleware or Cloudflare Worker:
if (request.protocol !== 'https') {
  return redirect(new URL(request.url).origin.replace('http://', 'https://'));
}
```

### 8.2 Secrets management (Cloudflare)

**Never commit secrets to Git.** Use Cloudflare environment variables:

```toml
# wrangler.toml
[env.production]
vars = { ENVIRONMENT = "production" }

[[env.production.secrets]]
binding = "DB_URL"

[[env.production.secrets]]
binding = "OTP_API_KEY"

[[env.production.secrets]]
binding = "R2_SECRET_ACCESS_KEY"
```

**Access in code:**
```typescript
const DB_URL = env.DB_URL; // Injected at runtime, never logged
const OTP_KEY = env.OTP_API_KEY;
```

### 8.3 Hash OTPs (never store plaintext)

```typescript
import crypto from 'crypto';

async function generateOTP(mobile: string): Promise<{ otp: string; hash: string }> {
  const otp = crypto.randomInt(100000, 999999).toString(); // 6-digit OTP
  const hash = crypto.createHash('sha256').update(otp).digest('hex');
  
  // Store only the hash
  await db.insert(otp_logs).values({
    mobile_hash: hashPhoneForLookup(mobile), // Hash the mobile too
    otp_hash: hash,
    attempts: 0,
    created_at: new Date(),
  });
  
  // Return plaintext OTP to send via SMS; never store it
  return { otp, hash };
}

async function verifyOTP(mobile: string, otp: string): Promise<boolean> {
  const hash = crypto.createHash('sha256').update(otp).digest('hex');
  
  const log = await db.query.otp_logs.findFirst({
    where: {
      mobile_hash: hashPhoneForLookup(mobile),
      otp_hash: hash,
      created_at: { gt: new Date(Date.now() - 10 * 60 * 1000) }, // Valid for 10 mins
    }
  });
  
  return !!log;
}
```

### 8.4 Rate-limiting OTP and report endpoints

```typescript
import Ratelimit from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, '15m'), // 3 OTP requests per 15 mins per IP
});

async function handleOTPRequest(mobile: string, ip: string) {
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return { error: 'Too many OTP requests. Try again in 15 minutes.', status: 429 };
  }
  
  // Generate and send OTP
  const { otp } = await generateOTP(mobile);
  await sendSMS(mobile, `Your OTP: ${otp}`);
  
  return { status: 200, message: 'OTP sent' };
}
```

### 8.5 Audit log for admin actions

```typescript
async function adminSuspendPage(pageId: string, adminId: string, reason: string) {
  // Log the action
  await db.insert(audit_log).values({
    action: 'page_suspended',
    resource_type: 'page',
    resource_id: pageId,
    actor_id: adminId,
    actor_type: 'admin',
    reason,
    timestamp: new Date(),
  });
  
  // Perform the action
  await db.update(pages).set({ status: 'suspended' }).where({ id: pageId });
}

// Query audit log for compliance
async function getAuditTrail(pageId: string) {
  return db.query.audit_log.findMany({
    where: { resource_id: pageId },
    orderBy: { timestamp: 'desc' },
  });
}
```

### 8.6 Least-privilege database access

- **App user:** can read pages, insert events, update own profile.
- **Admin user:** can read all, update pages (suspend), delete (soft).
- **Analytics user:** can read events only (no names, mobiles).

```typescript
// In Drizzle ORM or raw SQL:
GRANT SELECT ON pages TO app_user;
GRANT INSERT ON page_daily_events TO app_user;
GRANT UPDATE ON pages WHERE owner_id = CURRENT_USER TO app_user;

GRANT SELECT, UPDATE, DELETE ON pages TO admin_user;
GRANT SELECT ON page_daily_events TO analytics_user;
```

---

## 9. Breach notification and response

**DPDP Act § 8(3); Rules § 12: Any suspected breach is reported immediately to the Data Protection Board and affected people within timelines specified in the Rules. A breach process must exist before launch.**

### 9.1 Breach definition

**Personal data is breached if:**
- An unauthorized person accesses it (e.g., SQL injection, stolen credentials).
- Data is modified or deleted (ransomware, data corruption).
- Data is lost (e.g., hard drive failure, accidental deletion without backup).
- Confidentiality or integrity is compromised.

### 9.2 Breach response timeline

| Step | Deadline | Action |
|------|----------|--------|
| 1. Detect breach | Immediately | Alert founder and tech lead |
| 2. Investigate | Within 48 hours | Determine scope, affected data, cause |
| 3. Notify Data Protection Board | Per Rules timeline (TBD by counsel T6) | File formal breach notification |
| 4. Notify affected individuals | Per Rules timeline | Email/SMS to users whose data is affected |
| 5. Publish breach report | Per Rules timeline | Public transparency (if required) |

### 9.3 Breach checklist

- [ ] Error tracking (Sentry, LogRocket) configured to alert on security errors.
- [ ] Database backup strategy (daily snapshots, offsite).
- [ ] Incident response contact: founder mobile, CTO email, legal counsel.
- [ ] Breach notification template: email/SMS to affected users.
- [ ] Data Protection Board contact details and process.
- [ ] Counsel review of breach playbook (T6).

### 9.4 Breach notification example

**Email to affected user:**

```
Subject: Important Security Notice - Your Data May Have Been Affected

Dear [User Name],

On [date], we discovered a security incident that may have affected 
your personal data (mobile number, profile information, page views).

What happened:
[Brief, non-technical explanation]

What we're doing:
- We've fixed the vulnerability and notified data protection authorities.
- Your data is secure. We've implemented additional safeguards.
- You can reset your password and review your account at /account.

Your rights:
- Download your data: /account/download
- Delete your account: /account/settings
- File a grievance: /grievance
- Contact counsel: [legal email]

We sincerely apologize for this incident. If you have questions, 
please reach out to us at privacy@advocateid.in.

Regards,
Advocate ID Team
```

---

## 10. Processors: list vendors and contracts

**DPDP Act § 18; Rules § 9: List every vendor that touches personal data with location and contract. Do not add a new vendor without adding it here.**

### 10.1 Processor list (as of launch)

| Vendor | Type | Location | Data handled | Contract status | Notes |
|--------|------|----------|---|---|---|
| **Cloudflare** | CDN, DNS, Workers, D1 | Global (US, EU, APAC) | All (encrypted at rest, in transit) | GDPR DPA required | Core infrastructure |
| **Cloudflare R2** | Image storage | Global | Photos, R2 keys | Covered by Cloudflare DPA | Profile pics, banners, office photos |
| **[OTP/SMS provider]** | OTP delivery, SMS | India (TBD) | Mobile number, OTP hash | DPA required (T5) | Twilio, MSG91, or other; TBD |
| **[Email provider]** | Email (future) | TBD | Email address (if added) | DPA required | Not in MVP 1 |
| **Google Search Console** | Analytics | Google Cloud | Domain, traffic data (non-PII) | Google Cloud ToS | For SEO monitoring only |
| **Cloudflare Analytics** | Analytics | Cloudflare | Per-hostname traffic, non-PII | Covered by Cloudflare DPA | Built-in; no external transfer |
| **[Google Analytics 4]** | Analytics (MVP 2) | Google Cloud | IP, device ID (if enabled) | Google Cloud ToS + consent | Opt-in with DPDP compliance |
| **Admin access (logs)** | Monitoring | Cloudflare Workers | Request/response logs | Managed internally | For debugging and compliance audit |

### 10.2 What NOT to do

- Do NOT add a new vendor without: a) DPA or data processing agreement, b) vendor in the processor list, c) user consent (if new data collection).
- Do NOT subcontract to a vendor that subcontracts further without explicit approval.
- Do NOT transfer personal data to countries outside India without a lawful basis (DPDP Act § 2(1)).

### 10.3 DPA template (for vendors)

**Minimum clauses:**
1. Vendor processes data only on written instruction.
2. Vendor implements security measures (encryption, access controls, audit log).
3. Vendor notifies us immediately of any breach or unauthorized access.
4. Vendor deletes or returns data on contract termination.
5. Vendor allows us to audit compliance (annual or on-demand).
6. Vendor does not subcontract without our written approval.

---

## 11. No personal data in logs or error trackers

**Never log personal data to console, error trackers (Sentry), or analytics.**

### 11.1 What NOT to log

```typescript
// ✗ BAD: Mobile number, OTP, names in logs
console.log(`User ${user.name} with mobile ${user.mobile} signed up`); // Exposed!
console.error(`OTP ${otp} sent to ${mobile}`); // Never log OTP!
Sentry.captureException(new Error(`Login failed for ${mobile}`)); // Exposes mobile
```

### 11.2 What TO log

```typescript
// ✓ GOOD: Generic, non-identifiable logs
console.log('New account created'); // No names
console.error('OTP verification failed'); // No mobile, no OTP
Sentry.captureException(new Error('Login error'), {
  tags: { reason: 'otp_mismatch' }, // Generic reason
  // No user info
});
```

### 11.3 Implementing safe logging

```typescript
function safeLog(message: string, context?: { [key: string]: unknown }) {
  // Strip personal data from context
  const safe = Object.fromEntries(
    Object.entries(context || {}).filter(
      ([k]) => !['mobile', 'email', 'otp', 'name', 'password'].includes(k)
    )
  );
  
  console.log(message, safe);
}

safeLog('User account deleted', { account_id: 'acc_123' }); // OK
safeLog('OTP failed', { attempt: 3 }); // OK; no mobile or OTP
```

---

## 12. Never put mobile numbers in URLs

**Mobile numbers are PII. Never expose them in URLs.**

### 12.1 What NOT to do

```
GET /api/user?mobile=+919876543210  // Exposed in URL and logs
POST /contact?from=919876543210     // Exposed in referrer headers
/account/settings?mobile=919876543210 // Exposed in browser history
```

### 12.2 What TO do

```
GET /api/account/{accountId}  // Use account ID, not mobile
POST /api/otp (body: { mobile: "..." }) // Mobile in POST body, encrypted in transit
/account/settings  // Slug or account ID in route, never mobile
```

---

## 13. Compliance phases and T6 tasks

| Phase | By date | Task | Owner | Status |
|-------|---------|------|-------|--------|
| **Phase 0** | Jan 2026 | Set up all tables, retention, purge jobs, logging | Dev | **In progress** |
| **Phase 1** | Feb 2026 | Notice, consent, audit log implementation | Dev + Legal | Open |
| **Phase 2** | Mar 2026 | Breach process, data protection officer (if needed), DPAs with vendors | Legal | T6 |
| **Phase 3** | Apr 2026 | Launch with full DPDP compliance | All | Pending phases 0–2 |

---

## 14. Testing and validation

### 14.1 Manual tests

- [ ] Signup: Privacy notice shown before OTP (can't skip).
- [ ] Consent: Can withdraw analytics consent in /account/settings; essential cookies persist.
- [ ] Download: `/account/download` returns complete data JSON.
- [ ] Correct: Update bio, photo, phone in /manage/{pageId}; changes logged in audit trail.
- [ ] Delete: /account/settings > Delete account soft-deletes account and pages within 30 days.
- [ ] OTP: OTP sent within 2 mins; valid for 10 mins; hashed in DB (not plaintext).
- [ ] Grievance: Submit at /grievance; receive acknowledgement SMS/email within 1 hour.
- [ ] Rate limit: Request OTP > 3 times in 15 mins; 429 error.
- [ ] Logs: Check server logs; no mobile, OTP, or names logged. ✓

### 14.2 Security tests

- [ ] SQL injection: Try `') OR '1'='1` in search; no data leaked.
- [ ] XSS: Post `<script>alert('xss')</script>` in bio; rendered as text, not executed.
- [ ] CSRF: Form tokens on all state-changing endpoints.
- [ ] HTTPS: All traffic TLS 1.3; no HTTP fallback.
- [ ] Secrets: No env vars in Git; Cloudflare secrets used. Run `git log` to check.
- [ ] Rate limit: OTP endpoint returns 429 after 3 requests in 15 mins.

### 14.3 Retention job tests

- [ ] OTP logs: Older than 7 days are deleted nightly.
- [ ] Raw events: Older than 30 days are aggregated and deleted.
- [ ] Deleted accounts: Hard-purged 30 days after soft delete.
- [ ] Run purge jobs manually on staging; verify data deleted correctly.

---

## 15. Counsel sign-off checklist (T6)

- [ ] DPDP phase timeline confirmed (notify, breach, board timelines).
- [ ] Data Protection Officer required? (Likely no for small org, but counsel confirms.)
- [ ] Processor list and vendor DPAs reviewed.
- [ ] Breach notification template approved.
- [ ] Grievance process aligned with Rules.
- [ ] No conflicts with Bar Council Rule 36 or IT Rules 2021.
- [ ] Insurance: cyber/data breach insurance required?
- [ ] Updates to AGENTS.md section 2 finalized.

---

## 16. References

- **DPDP Act 2023:** https://www.meity.gov.in/
- **DPDP Rules 2025 (notified 13 Nov 2025):** https://www.meity.gov.in/
- **Data Protection Board (contacts and process):** TBD by counsel (T6)
- **Cloudflare Data Processing Addendum:** https://www.cloudflare.com/dpa/
