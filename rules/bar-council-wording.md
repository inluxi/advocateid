# /rules/bar-council-wording.md: Bar Council Rule 36 compliance

*Advocates may not solicit work or advertise. Rule 36 proviso allows: name, enrolment, bar council membership, professional and academic qualification, area of practice. This file lists what is banned, what is allowed, and field-by-field guidance.*

*Status: Draft pending counsel review (T2). Not legal advice.*

---

## 1. Banned phrases and styles

**Strictly forbidden (no context, no exception):**

| Phrase | Why | Alternative |
|--------|-----|-------------|
| best | Superlative; solicits | (leave out) |
| top | Superlative; solicits | (leave out) |
| leading | Superlative; solicits | (leave out) |
| number one, #1 | Superlative; solicits | (leave out) |
| famous | Solicits reputation; misleading | (leave out) |
| expert in | Superlative; may violate scope | "Practises in" or "Works on" |
| guaranteed | Promise of outcome | (leave out) |
| won | Boasts of success | "Represented the petitioner" |
| 100% success rate | Impossible claim | State facts: "Outcome: petition allowed" |
| winning | Solicits | "Represented" |
| cheap | Violates advertising ban | (leave out) |
| discount | Violates advertising ban | (leave out) |
| hire | Solicits work | "Connect" (via WhatsApp) |
| book now | Solicits work | "Connect" |
| reliable | Subjective puff | (leave out) |
| most | Superlative | (leave out) |
| client testimonials | Reviews; violates ban | (leave out; MVP 2+ with counsel) |
| client reviews | Reviews; violates ban | (leave out; MVP 2+ with counsel) |
| star ratings | Violates ban | (leave out; MVP 3 with counsel) |
| 5-star | Violates ban | (leave out) |
| before/after | Case outcome with photos | Text only: court, year, outcome |
| case photos | Associates faces with outcomes; risk | (leave out) |
| fee display | Price comparison; risky | (leave out) |
| price | Invites comparison | (leave out) |

---

## 2. Allowed style: plain facts

The legal standard is disclosure, not marketing. Use:

**✓ Allowed:**
- "Practises in [area]"
- "Represented the petitioner. Family Court, Ernakulam, 2023. Outcome: petition allowed."
- "Handles matrimonial, succession and commercial matters"
- "Enrolment number: [number], Bar Council of [state]"
- "Admitted [year]"
- "B.A. (Hons) in Law, [university]"
- "M.B.A., [institution]"
- "Specialises in corporate transaction structuring"
- "Working in [district] since [year]"
- "Based in Kochi with offices in Thiruvananthapuram and Kozhikode"
- "Head of the Family Law practice"

**✗ Forbidden:**
- "Best family lawyer in Kerala"
- "Winning matrimonial outcomes 99% of the time"
- "Top corporate transaction specialist"
- "Guaranteed dismissal of charges"
- "5-star rated by clients"
- "Booked by 500+ clients this year"

---

## 3. Field-by-field review (T2 in progress)

### 3.1 Profile picture
**Allowed?** Yes. **Rules:**
- Headshot or professional photo.
- No case-related background (e.g., courthouse steps).
- No logo or brand overlays.
- No "hero" styling (e.g., posed with scales of justice).

**Banned words:** none (image only).

---

### 3.2 Banner image
**Allowed?** Yes (Professional and Premium plans; not Basic). **Rules:**
- Firm branding, office photo, or professional background.
- No client faces or case-related imagery.
- No claim text overlaid (e.g., "Best in India").
- Subtitle text allowed: "Corporate Law Practice, Established 2015" (facts only).

**Banned words:** best, top, leading, expert, guaranteed, winning, cheap, discount, #1.

---

### 3.3 Name
**Allowed?** Yes (mandatory). **Rules:**
- Individual or firm name as registered.
- No titles (Dr., Jr., Esq.) unless part of the legal name.
- No marketing suffix (e.g., "Sharma & Associates – The Best Lawyers").

**Banned words:** best, top, leading, expert, number one, #1, famous, winning.

---

### 3.4 Enrolment number (advocates)
**Allowed?** Yes (mandatory). **Rules:**
- Shown "as declared" by the advocate.
- Bar Council validation is future work (MVP 2+).
- Never hidden or omitted.
- Format: numeric or alphanumeric per state bar council.

**Banned words:** none (numeric only).

---

### 3.5 Bio (500 characters)
**Allowed?** Yes. **Rules:**
- Professional summary: areas of practice, experience, registration, education.
- No superlatives or promises.
- No client testimonials or case outcomes.
- Plain facts only.

**Example:**
```
Advocate practising corporate law and M&A. 15 years in transaction structuring 
and regulatory compliance. B.Com (Hons), LL.B. Bar Council of Kerala. 
Based in Kochi.
```

**Banned words:** best, top, leading, expert in, guaranteed, winning, won, 100% success, 
famous, cheap, discount, hire, book, reliable, client testimonials, star ratings, 5-star, fees, price.

**Implementation:** Live editor shows a word-check warning. Flag any banned phrase and suggest a plain alternative.

---

### 3.6 About (5,000 characters, rich text)
**Allowed?** Yes. **Rules:**
- Professional bio, experience narrative, practice focus, education, memberships.
- Case summaries embedded (with dates, courts, outcomes; no client names or photos).
- Can mention specific practice areas and years of experience.
- No client reviews, testimonials, or ratings.

**Example:**
```
I practise corporate law, specialising in mergers and acquisitions, joint ventures, 
and regulatory compliance. I have advised 50+ companies on transaction structures and 
due diligence. Matters handled include:

- M&A structuring for IT companies (2020–2023)
- Regulatory filings with the Ministry of Corporate Affairs (2015–present)
- Employment law for multinational firms (2018–present)

I hold an LL.M. in Corporate Law from [university] and have been admitted to the 
bar since 2010. I am a member of the [bar council] and [professional association].
```

**Banned words:** best, top, leading, expert in (use "practises in" or "advises on"), 
guaranteed, winning, won, 100% success, famous, cheap, discount, hire, book, reliable, 
client testimonials, star ratings, 5-star, fees, price, before/after photos.

**Implementation:** Live editor runs banned-word check and warns on any match. User can override but the warning persists.

---

### 3.7 Highlights (Professional and Premium; max 4)
**Allowed?** Yes (Professional+). **Rules:**
- Short claims about practice focus, certifications, or milestones.
- Format: label (up to 20 chars) + number (up to 3 digits).
- Examples:
  - "Court appearances: 200+" (or "150")
  - "Years in practice: 15"
  - "Languages: 3" (English, Hindi, Malayalam)
  - "Offices: 2" (Kochi, Thiruvananthapuram)
  - "Corporate transactions: 50+"

**Banned words:** best, top, leading, winning, cheap, discount, hire, book, expert, guaranteed, 
famous, reliable, #1, number one, 100% success.

**Risky wording:** avoid "satisfied clients," "success rate," "client testimonials," or any superlative.

**Allowed:** factual counts (years, offices, languages, publication count, court names).

**Implementation:** Live editor accepts label + number input. A dropdown suggests safe labels. 
User cannot enter free text (locked format).

---

### 3.8 Links (Professional and Premium; up to 5)
**Allowed?** Yes (Professional+). **Rules:**
- Professional profiles (LinkedIn, Bar Council website, Bar Association).
- Published articles or judicial database links.
- Firm website or practice blog.
- Official social media (LinkedIn, Twitter, YouTube for firm/practice announcements).
- No personal social media (Facebook, Instagram unless practice-only account).
- Icons auto-generated from favicon.

**Banned URLs:** any URL with "book," "hire," "order," "get started," or discount links.

**Implementation:** URL input with auto-detection. Warn if URL contains booking language.

---

### 3.9 Courts of practice (max 5 / 10 / 10 per plan)
**Allowed?** Yes. **Rules:**
- Dropdown of seeded courts only (no free text).
- Can list up to 5–10 courts where the advocate has practiced.
- Sorting by frequency or recency is fine.

**Banned words:** best, top, leading, preferred, favourite, expert in (use the practice area instead).

**Allowed:** court name only. No commentary.

**Implementation:** Searchable dropdown. No free text.

---

### 3.10 Practice areas (max 5 / 10 / 10 per plan)
**Allowed?** Yes. **Rules:**
- Dropdown of seeded categories only (no free text).
- Can list up to 5–10 areas.
- Sorting by frequency is fine.

**Banned words:** expert in, best, top, leading, winning, specialist (use "Practises in" instead).

**Allowed:** category name only.

**Implementation:** Searchable dropdown. No free text.

---

### 3.11 Career timeline (max 5 / 10 entries per plan)
**Allowed?** Yes. **Rules:**
- Chronological list of positions, education, certifications.
- Format: year or year range, title/degree, institution/firm.
- Can include brief description (one line).
- No outcome claims or testimonials.

**Examples:**
```
2023 – Present | Senior Associate | Sharma & Co.
2020 – 2023 | Associate | [firm]
2018 | LL.M. Corporate Law | [university]
2015 | B.A. LL.B | [university]
2010 | Admitted to Bar Council of Kerala
```

**Banned words:** best, top, leading, winning, expert, promoted to "head of" (factual title only), 
trusted by, famous for.

**Allowed:** titles (e.g., "Head of Family Law"), years, firms, achievements of the role (e.g., "managed 20 associates").

**Implementation:** Simple form: year range, title, institution, notes. No autocomplete for titles; free text allowed (moderated by live editor checks).

---

### 3.12 Case summaries (max 2 / 10 entries per plan)
**Allowed?** Yes. **Rules:**
- Court, year, your role, outcome, optional short note, optional link.
- Facts only; no client identification, no photos.
- Outcome is factual (Petition allowed, Dismissed, Partly allowed, Settled, Pending, Other).

**Examples:**
```
Court: Family Court, Ernakulam
Year: 2023
Role: Appeared for the petitioner
Outcome: Petition allowed
Note: Custody matter involving dispute over guardianship

Court: Supreme Court of India
Year: 2021
Role: Appeared for the respondent
Outcome: Partly allowed
Note: Constitutional challenge to the notification
```

**Banned words:** winning, won, landmark, historic, best, leading, guaranteed, top, expert, famous, 
successful, client testimonial.

**Allowed:** court name, year, role, outcome, neutral note (no spin).

**Implementation:** Form with dropdowns for Court (seeded) and Outcome (fixed list). Notes field (200 chars) runs banned-word check. Link field accepts URL (nofollow, any domain).

---

### 3.13 Offices (main + branches; max 1 / 5 / 5 per plan)
**Allowed?** Yes. **Rules:**
- Address, phone, office hours, local description (max 200 chars).
- Local description can mention focus courts, local practice style, or team.
- No superlatives or outcome boasts.

**Example local description:**
```
Our Thiruvananthapuram office handles family law and property matters in the district. 
Open 9 AM–6 PM, Monday–Friday. Phone: +91 472 XXXXX.
```

**Banned words:** best, top, leading, expert, guaranteed, winning, cheap, discount, busy, popular, 
client testimonials, star ratings.

**Allowed:** factual location, hours, court focus, team intro (neutral tone).

**Implementation:** Form with address autocomplete. Hours picker. Phone with OTP. Local description text area with banned-word check.

---

### 3.14 Lawyers on firm page (max 1 / 5 / unlimited per plan)
**Allowed?** Yes. **Rules:**
- Name, title at office, photo, 200-character intro.
- Intro can mention practice areas, years, education.
- No outcome claims or client testimonials.

**Example intro:**
```
Sriram practises family and succession law with 12 years' experience. 
LL.B. (Hons), Bar Council of Kerala. Based in our Kochi office.
```

**Banned words:** expert, leading, winning, top, best, guaranteed, famous, cheap, discount, 
beloved by clients, highly rated.

**Allowed:** name, title (e.g., "Senior Associate, Family Law"), years, education, practice areas.

**Implementation:** Form with name, title, photo upload, intro text area (200 chars). Banned-word check on intro.

---

### 3.15 Posts (articles by advocates)
**Allowed?** Yes. **Rules:**
- Title, body (up to 10,000 chars), cover image, categories (max 3), optional court tag, optional source link.
- Educational articles about law, practice updates, or court insights.
- No direct client solicitation or outcome boasting.
- Can mention case types the author handles, but not "won 95% of cases."

**Example post title and opening:**
```
Title: Understanding the Guardianship and Wards Act in Kerala

Body:
The Guardianship and Wards Act, 1890, governs custody and guardianship matters in India. 
In Kerala, Family Courts apply the Act alongside the Juvenile Justice Act, 2015. 
This article explains the key provisions and common disputes...
```

**Banned words:** best, top, leading, expert (use "handles" or "practises in"), guaranteed, winning, 
won, 100% success, famous, cheap, discount, hire, book, client testimonials, 5-star, star ratings.

**Allowed:** educational content, court insights, practice area overviews, case type descriptions (neutral).

**Implementation:** WYSIWYG editor with live banned-word scan. Flag on publish if any banned phrase is found.

---

### 3.16 Court updates (contributed by advocates)
**Allowed?** Yes. **Rules:**
- Title, body (up to 5,000 chars), court tag (mandatory), source link (mandatory).
- Updates about case listings, court orders, procedural changes, judicial appointments.
- Published with "Contributed by [page name]" attribution.
- Author is responsible for accuracy; anyone can report it.

**Example:**
```
Title: High Court Issues Interim Relief in Environmental Petition

Body:
The High Court of Kerala granted interim relief on 15 Oct 2025 in WP(C) No. 12345/2025, 
staying the construction project pending hearing. The next hearing is set for 20 Nov 2025...

Court: High Court of Kerala
Source: [link to order or news]
```

**Banned words:** (same as posts) best, top, leading, expert, guaranteed, winning, won.

**Allowed:** court name, case number, judge name, procedural updates, neutral fact reporting.

**Implementation:** Form with Court dropdown (seeded), body text area, source URL (required). Live banned-word check.

---

## 4. Wording check implementation

### 4.1 Where to run checks
1. **Bio, About, Highlights, Links, Intro, Local description, Posts, Court updates:** every field with free text.
2. **Case summaries, Career timeline notes:** brief text fields.
3. **Slug, Title, Enrolment:** numeric/controlled; no check needed.

### 4.2 How to implement
```typescript
const bannedWords = [
  'best', 'top', 'leading', '#1', 'number one', 'famous', 'expert in',
  'guaranteed', 'won', 'winning', '100% success', 'cheap', 'discount',
  'hire', 'book now', 'book', 'reliable', 'most', 'client testimonials',
  'client reviews', 'star ratings', '5-star', 'before and after', 'case photos',
  'fee', 'price'
];

function flagBannedWords(text: string): { found: string[]; flagged: boolean } {
  const found = bannedWords.filter(word =>
    new RegExp(`\\b${word}\\b`, 'gi').test(text)
  );
  return { found, flagged: found.length > 0 };
}
```

### 4.3 UI feedback
- **On input or blur:** scan the text; if any banned word is found, show an inline warning.
  ```
  ⚠️ "best" and "expert" are not allowed. Use "handles" or "practises in" instead.
  ```
- **On publish/save:** if flagged, show a dialog:
  ```
  Warning: This text contains banned phrases ("best", "winning"). 
  Review the Bar Council rules at /rules/bar-council-wording.md. 
  You can still save, but the content may not comply.
  
  [Review] [Save anyway] [Cancel]
  ```
- **For admins:** log all flagged content and highlight for manual review.

### 4.4 Case-insensitive matching
- "Best", "BEST", "best" are all flagged.
- "Bestow" and "bestseller" are NOT flagged (word boundary check).

---

## 5. Risk matrix

| Field | Risk Level | Requires Switch? | Notes |
|-------|-----------|-----------------|-------|
| Picture | Low | No | Enforce professional style guidelines |
| Banner | Medium | Maybe | Consider hiding for Basic plan |
| Bio | High | No | Live wording check; warn on banned words |
| About | High | No | Live wording check; allow override with warning |
| Highlights | Medium | No | Locked format (number + label dropdown) |
| Links | Medium | No | Warn on URLs with "book" or "hire" |
| Courts | Low | No | Dropdown only |
| Categories | Low | No | Dropdown only |
| Career | Medium | No | Wording check on description |
| Case summaries | High | No | Wording check; note field scanned |
| Offices | Medium | No | Wording check on local description |
| Lawyers | Medium | No | Wording check on intro |
| Posts | High | No | Live wording check; flag on publish |
| Court updates | High | No | Live wording check; flag on publish |

**Per-field switches (T2):** counsel to advise if we need toggles to hide certain fields entirely (e.g., "turn off case summaries for this advocate" without editing the data).

---

## 6. Counsel review checklist (T2)

- [ ] Is the banned-word list complete? Any phrases we missed?
- [ ] Should "expert" ever be allowed (e.g., "tax expert" in a bio)? Context?
- [ ] Can we say "certified" or "accredited" in any field?
- [ ] Are case summaries inherently problematic (Rule 36 violation) or acceptable as plain facts?
- [ ] Should we hide certain fields (bio, highlights, case summaries, posts) entirely per state or advocate request?
- [ ] Do we need per-field approval by a moderator (not live)?
- [ ] What's the liability if we publish non-compliant content? Who's responsible: the advocate or the platform?
- [ ] Should we require pre-publication review for certain content (posts, court updates)?

---

## 7. References

- **Bar Council of India Rules, 1988, Part VI, Chapter II, Rule 36:** https://www.bci.org.in/
- **Sulekha (Madras High Court ruling + Supreme Court appeal):** pending counsel research (T2).
- **Bar association circulars (state-specific):** check Bar Council of [state] websites.

---

## 8. Examples of compliant content

### Advocate page (compliant)
```
Name: Priya Sharma
Enrolment: KL1234/2010
Bio: Practises family and matrimonial law. 15 years' experience. 
B.A. LL.B. (Hons), Bar Council of Kerala. Based in Kochi.

About:
Priya Sharma handles matrimonial disputes, child custody, and succession matters. 
She has appeared in the Family Courts of Kochi, Thiruvananthapuram, and Alappuzha 
for the past 15 years. Her cases include:
- Divorce petitions and settlement negotiations (2015–present)
- Child custody disputes (2012–present)
- Property succession matters (2010–present)

Education: B.A. LL.B. (Hons), [university], 2010. 
Bar Council of Kerala, admitted 2010.

Courts: Family Court Kochi, High Court of Kerala
Categories: Family Law, Matrimonial, Succession

Highlights:
- Court appearances: 200+
- Years in practice: 15
- Languages: 3 (English, Hindi, Malayalam)

Career timeline:
2015–Present | Senior Associate | Sharma & Associates
2010–2015 | Associate | [firm]
2010 | B.A. LL.B. (Hons) | [university]

Case summaries:
1. Court: Family Court, Kochi | Year: 2023 | Role: Petitioner's counsel 
   | Outcome: Petition allowed | Note: Divorce petition with mutual consent

2. Court: High Court of Kerala | Year: 2021 | Role: Respondent's counsel 
   | Outcome: Partly allowed | Note: Custody dispute

Posts:
- "Understanding the Hindu Marriage Act in Kerala" (published 15 Oct 2025)
- "Child Custody: Rights and Duties" (published 05 Aug 2025)
```

### Firm page (compliant)
```
Name: Sharma & Associates LLP
Established: 2015
Bio: Corporate law firm specialising in M&A, regulatory compliance, and transaction structuring.

Offices:
1. Main: Kochi (address, +91 XXXX phone, 9 AM–6 PM)
2. Branch: Thiruvananthapuram (address, +91 XXXX phone, 9 AM–6 PM)

Lawyers:
- Priya Sharma, Senior Associate, Family Law (intro: 15 years, B.A. LL.B.)
- Rajesh Nair, Associate, Corporate Law (intro: 8 years, M.Com LL.B.)

Links:
- LinkedIn: [firm LinkedIn profile]
- Bar Council: [bar council registration]

Courts: High Court of Kerala, Family Court Kochi, Commercial Court Kochi
Categories: Corporate Law, M&A, Matrimonial, Succession

Highlights:
- Years established: 9
- Lawyers: 8
- Offices: 2

Posts:
- "M&A Structuring for IT Companies" (published 20 Sep 2025)
- "GST Compliance for Law Firms" (published 10 Jul 2025)
```

### Non-compliant (❌ examples)

❌ "Best divorce lawyer in Kerala"
❌ "300+ winning cases"
❌ "Guaranteed custody outcomes"
❌ "5-star rated by 200+ clients"
❌ "Book a free consultation"
❌ "Expert in matrimonial law" (use "Practises in" instead)
❌ "Leading corporate transaction specialist"

---

## 9. Questions for counsel (T2)

1. Can we display a "Verified by Bar Council" seal if the enrolment number is confirmed as active?
2. Should we pre-approve certain fields (posts, case summaries) before publishing, or is live flagging enough?
3. What happens if an advocate publishes non-compliant content and we don't moderate it? Platform liability?
4. Can we allow star ratings if they are NOT displayed but stored for internal ranking? (DPDP + Rule 36 question.)
5. Are there state-specific wording rules we should know about (e.g., Bar Council of Tamil Nadu vs Kerala)?
