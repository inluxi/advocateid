================================================================================
PROFESSIONAL DIRECTORY SAAS — UI/UX DESIGN PROMPT FOR CLAUDE DESIGN
================================================================================
Status: Ready for Senior UI/UX Designer Implementation
Date: September 2026
Verticals: Lawyers, Chartered Accountants (CAs), Tax Professionals
Context: Indian market, mobile-first, professional demographics

================================================================================
DESIGN BRIEF OVERVIEW
================================================================================

PROJECT:
  • Professional directory SaaS platform
  • Three verticals: Lawyers, CAs, Tax Professionals
  • Three pricing tiers with distinct UX: Free, Premium, CNAME Custom Domain
  • Customizable color theming (default → professional's brand color)
  • Hero image-first layout (vertical photos, responsive desktop/mobile)
  • 60% SEO generic content + 40% unique professional content

TARGET AUDIENCE:
  • Primary: Legal professionals (lawyers/advocates), tax consultants, chartered accountants
  • Secondary: Visitors searching for professionals (mobile-first, high intent)
  • Geographic: India (Hindi/English bilingual consideration, local design patterns)
  • Devices: Mobile (60% of traffic), tablet (20%), desktop (20%)

DESIGN SYSTEMS:
  • Tier 1 (Free): Basic light theme, generic branding
  • Tier 2 (Premium): Color-customizable theme, professional branding
  • Tier 3 (CNAME): White-label theme, completely custom color + branding
  • Shared structure: Layout, spacing, typography remain consistent across tiers

================================================================================
DESIGN PRINCIPLES & CONSTRAINTS
================================================================================

1. PROFESSIONAL & TRUSTWORTHY
   • Clean, minimal design (no clutter, no gaming-style elements)
   • Legal/regulatory respectability (serious, not flashy)
   • Credentials & expertise prominently displayed
   • Trust signals: verified badges, review counts, response time data

2. INDIA-FIRST AESTHETIC
   • Warm, welcoming color palettes (blues, greens, golds for law/finance)
   • Professional photography standards (Indian professionals prefer formal portraits)
   • Text hierarchy supports Hindi/English mixed content (if applicable)
   • Mobile-first: assumes 4.5-6" screens, thumb-friendly CTAs
   • Loading optimization: fast on 3G/4G networks (image lazy-loading, progressive rendering)

3. HERO IMAGE AS PRIMARY CONTENT
   • Hero photo is THE FIRST visual (above fold, takes 40-50% of viewport on mobile)
   • Vertical aspect ratio (9:16 or 4:5) to accommodate professional portraits
   • Responsive: desktop (left-aligned, large), mobile (top-aligned, full-width)
   • Photo quality signals professionalism (frame, lighting, dress code)

4. CONTENT STRATEGY: 60% GENERIC + 40% UNIQUE
   • 60% Generic (SEO-driven, system-generated):
     - Specialization tags (taxonomy)
     - Service areas (geographic, practice areas)
     - Contact CTA templates
     - Structured data (Schema.org markup, invisible to users)
     - City/vertical aggregation pages
   
   • 40% Unique (Professional-provided, differentiator):
     - Professional bio/headline
     - Career timeline / experience summary
     - Case studies / case outcomes
     - Articles / blog posts
     - Q&A answers
     - Custom bio (Premium tier)
     - Brand color choice (Premium tier)

5. TIER-SPECIFIC UX DIFFERENCES
   • Free Tier: Generic template, standard colors, competitors shown
   • Premium Tier: Customizable colors, no competitors shown, analytics access, review response
   • CNAME Tier: White-label (no platform branding), custom domain, full branding control

6. SEARCH-FRIENDLY (SEO LAYER)
   • Large heading hierarchy (H1, H2, H3 for semantic HTML)
   • Alt text on all images (hero photo, qualification badges, etc.)
   • Schema.org markup (invisible, for Google): Person, LocalBusiness, ProfessionalService
   • Canonical URLs (for CNAME white-label variants)
   • Mobile viewport meta tags, responsive images

================================================================================
INFORMATION ARCHITECTURE & LAYOUT
================================================================================

TIER 1: FREE TIER PROFILE PAGE
────────────────────────────────────────────────────────────────────────────

MOBILE VIEW (375px):
  ┌─────────────────────────────────┐
  │  [Platform Logo] [Menu]         │ ← Header (sticky, minimal)
  ├─────────────────────────────────┤
  │                                 │
  │  [HERO PHOTO — Vertical]        │ ← Hero image (9:16 or 4:5)
  │  [Full screen width, ~200-250px]│   Photo: Professional formal portrait
  │                                 │   Aspect ratio: works on all screens
  ├─────────────────────────────────┤
  │                                 │
  │ NAME: J. Gupta (Large, bold)    │ ← Professional info (40px heading)
  │ SPECIALIZATION: IP Law          │   Smaller secondary text
  │ 4.8★ (12 reviews)               │   Rating + review count
  │                                 │
  ├─────────────────────────────────┤
  │                                 │
  │ [WhatsApp] [Call] [Email]       │ ← CTA buttons (sticky, bright color)
  │                                 │
  ├─────────────────────────────────┤
  │ EXPERTISE TAGS:                 │ ← Specializations (pill badges)
  │ • IP Law                        │
  │ • Patent                        │
  │ • Trademark                     │
  │                                 │
  ├─────────────────────────────────┤
  │ COURTS OF PRACTICE:             │ ← Practice info (links to institutions)
  │ • Delhi High Court              │
  │ • IP Appellate Board            │
  │                                 │
  ├─────────────────────────────────┤
  │ BIO:                            │ ← Professional bio (40-60 words)
  │ "I specialize in IP law with    │   User-provided content
  │  10+ years experience..."       │
  │                                 │
  ├─────────────────────────────────┤
  │ CASE OUTCOMES:                  │ ← 3-5 featured cases (collapsible)
  │ ▼ Patent Infringement Case      │
  │   "Represented startup..."      │
  │   Outcome: Favorable            │
  │   Court: Delhi HC | 2023        │
  │                                 │
  ├─────────────────────────────────┤
  │ REVIEWS: (4.8 / 5, 12 reviews)  │ ← Social proof
  │ ⭐⭐⭐⭐⭐ "Very responsive..."   │
  │ ⭐⭐⭐⭐☆ "Good guidance..."     │
  │ [View All Reviews]              │
  │                                 │
  ├─────────────────────────────────┤
  │                                 │
  │ 🔴 COMPETITORS IN YOUR AREA     │ ← Free tier: competitors shown
  │ "Showing 4 other IP lawyers"    │
  │ • Best IP Law (₹0/mo) ★4.7      │
  │ • Patent Expert (₹0/mo) ★4.5    │
  │ • IP Solutions (₹0/mo) ★4.2     │
  │                                 │
  ├─────────────────────────────────┤
  │ [Upgrade to Premium →]          │ ← Upsell CTA
  │ "Hide competitors, get 50+ more"│
  │                                 │
  └─────────────────────────────────┘

DESKTOP VIEW (1200px):
  ┌─────────────────────────────────────────────────────────┐
  │ [Logo]  [Search]  [Professionals]  [About]  [Login]    │ ← Header
  ├──────────────────┬──────────────────────────────────────┤
  │                  │                                      │
  │  HERO PHOTO      │ NAME: J. Gupta                       │
  │  (Left, 40%)     │ IP Law Specialist                    │
  │  [Vertical       │ 4.8★ (12 reviews)                    │
  │   Portrait,      │                                      │
  │   Large]         │ [WhatsApp] [Call] [Email]            │
  │                  │                                      │
  │                  │ EXPERTISE TAGS:                      │
  │                  │ • IP Law  • Patent  • Trademark      │
  │                  │                                      │
  │                  │ BIO:                                 │
  │                  │ "I specialize in IP law with         │
  │                  │  10+ years experience in..."         │
  │                  │                                      │
  │                  │ COURTS:                              │
  │                  │ • Delhi High Court                   │
  │                  │ • IP Appellate Board                 │
  │                  │                                      │
  │                  │ CASE OUTCOMES:                       │
  │                  │ ▼ Patent Infringement Case           │
  │                  │   "Represented startup in..."        │
  │                  │   Outcome: Favorable                 │
  │                  │   Court: Delhi HC | 2023             │
  │                  │                                      │
  │                  │ REVIEWS:                             │
  │                  │ ⭐⭐⭐⭐⭐ "Very responsive"          │
  │                  │ ⭐⭐⭐⭐☆ "Good guidance"            │
  │                  │ [View All]                           │
  │                  │                                      │
  │                  │ COMPETITORS:                         │
  │                  │ • Best IP Law (₹0/mo) ★4.7          │
  │                  │ • Patent Expert (₹0/mo) ★4.5        │
  │                  │ • IP Solutions (₹0/mo) ★4.2         │
  │                  │                                      │
  │                  │ [Upgrade to Premium →]               │
  │                  │                                      │
  └──────────────────┴──────────────────────────────────────┘

────────────────────────────────────────────────────────────────────────────

TIER 2: PREMIUM TIER PROFILE PAGE (Same structure, but enhanced)
────────────────────────────────────────────────────────────────────────────

KEY DIFFERENCES FROM FREE TIER:

1. CUSTOMIZABLE COLOR THEME
   • Default: Blue (#0066CC) for lawyers, Green (#2D7C4A) for CAs, Orange (#E67E22) for tax
   • Professional picks brand color (color picker in settings)
   • Entire site recolors dynamically:
     - Primary buttons (WhatsApp, Call, Email CTAs)
     - Heading accents
     - Link colors
     - Badge backgrounds
     - Hover states
   • Logo/brand name can be updated in settings

2. HERO PHOTO + BRANDING
   • Same vertical aspect ratio hero photo
   • Logo/brand name overlay option (top-left or bottom-left of hero)
   • Professional name in custom brand color

3. COMPETITORS HIDDEN
   • "See other lawyers in Delhi" section is completely gone
   • User only sees THIS professional's profile (no comparison shopping)
   • Feels like a personal website, not a directory

4. ENHANCED ANALYTICS SECTION (Below fold)
   • "Your Profile Performance" widget
   • "X people viewed your profile this month"
   • "X clicks to WhatsApp/Call"
   • Geographic breakdown (Delhi: 45%, Gurgaon: 25%, etc.)
   • Referrer breakdown (Google: 60%, Direct: 25%, Organic: 15%)

5. REVIEW RESPONSE CAPABILITY
   • Professional can respond publicly to reviews
   • "Your response" appears below each review
   • Builds trust, shows engagement

6. VERIFIED BADGE ENHANCED
   • Full verification: email ✓, phone ✓, admin ✓
   • Appears next to name with checkmark icon

7. SOCIAL LINKS DISPLAY
   • LinkedIn, Facebook, Twitter, Instagram, personal website
   • Icons in footer or sidebar
   • Clickable links to external profiles

MOBILE VIEW (375px) — PREMIUM:
  ┌─────────────────────────────────┐
  │  [Logo] [Menu]                  │ ← Custom logo from settings
  ├─────────────────────────────────┤
  │                                 │
  │  [HERO PHOTO + Brand Name]      │ ← Logo overlay on hero photo
  │  [Custom color gradient behind] │   Brand color applied
  │                                 │
  ├─────────────────────────────────┤
  │                                 │
  │ J. Gupta ✓ (Verified)           │ ← Full verification badge
  │ IP Law Specialist               │
  │ 4.8★ (12 reviews)               │
  │                                 │
  ├─────────────────────────────────┤
  │                                 │
  │ [WhatsApp] [Call] [Email]       │ ← Buttons in custom color
  │                                 │
  ├─────────────────────────────────┤
  │ (NO COMPETITORS SECTION)         │ ← GONE — Premium perk
  │                                 │
  ├─────────────────────────────────┤
  │                                 │
  │ YOUR PROFILE PERFORMANCE        │ ← Analytics (Premium only)
  │ 127 views this month            │
  │ 12 clicks to WhatsApp           │
  │ Top referrer: Google (60%)       │
  │                                 │
  ├─────────────────────────────────┤
  │ [Manage settings] [View analytics] │ ← Links to dashboard
  │                                 │
  │ 🔗 [LinkedIn] [Facebook] [Web]  │ ← Social links (if added)
  │                                 │
  └─────────────────────────────────┘

────────────────────────────────────────────────────────────────────────────

TIER 3: CNAME CUSTOM DOMAIN PROFILE (White-Label)
────────────────────────────────────────────────────────────────────────────

KEY DIFFERENCES:

1. ZERO PLATFORM BRANDING
   • No "Top Lawyer" logo, no platform footer, no "Powered by TopLawyer"
   • Completely white-labeled to feel like professional's own website
   • Professional's logo (from settings) replaces platform logo

2. CUSTOM DOMAIN IN URL
   • gupta-legal.com (instead of toplawyer.in/lawyer/j-gupta)
   • Canonical URL in HTML meta (for SEO): points back to toplawyer.in/lawyer/j-gupta
   • Looks and feels like independent website

3. BRANDED HEADER & FOOTER
   • Header: Professional's name/logo + navigation (possibly: About, Cases, Contact)
   • Footer: Professional's contact info, social links, copyright
   • No platform attribution

4. FULL COLOR CUSTOMIZATION
   • All Premium features (color picker, analytics, review response, etc.)
   • Plus: complete branding control (header, footer, navigation colors)
   • Optional: custom subdomain icon/favicon

MOBILE VIEW (375px) — CNAME:
  ┌─────────────────────────────────┐
  │  [Professional's Logo]  [Menu]  │ ← Custom logo, no platform branding
  ├─────────────────────────────────┤
  │                                 │
  │  [HERO PHOTO]                   │ ← Same as Premium
  │  [Custom brand colors]          │
  │                                 │
  ├─────────────────────────────────┤
  │                                 │
  │ J. Gupta ✓                      │ ← Professional's name
  │ IP Law Specialist               │
  │ 4.8★ (12 reviews)               │
  │                                 │
  ├─────────────────────────────────┤
  │ [WhatsApp] [Call] [Email]       │
  ├─────────────────────────────────┤
  │ (Rest is same as Premium)        │
  │                                 │
  ├─────────────────────────────────┤
  │                                 │
  │ © 2024 J. Gupta Law Practice    │ ← Custom footer
  │ New Delhi | [Social Links]       │
  │                                 │
  └─────────────────────────────────┘

================================================================================
PROFESSIONAL DASHBOARD (SETTINGS & MANAGEMENT)
================================================================================

DESKTOP DASHBOARD (for Free/Premium tier professionals):

┌──────────────────────────────────────────────────────────────┐
│ [Logo]  Dashboard  [Help]  [Profile Preview]  [Logout]      │
├────────────────┬──────────────────────────────────────────────┤
│                │                                              │
│ SIDEBAR:       │ PROFILE EDITOR (Main area)                  │
│ • Profile Info │                                              │
│ • Analytics    │ PROFILE INFO                                │
│ • Settings     │ ├─ Name: [J. Gupta]                        │
│ • Billing      │ ├─ Specializations:                         │
│ • Support      │ │  ☑ IP Law  ☑ Patent  ☑ Trademark        │
│                │ ├─ Hero Photo Upload:                       │
│                │ │  [Upload Photo]                           │
│                │ │  Preview: [Vertical image shown]          │
│                │ ├─ Bio (40-60 words):                       │
│                │ │  [Text input field]                       │
│                │ ├─ Court of Practice:                       │
│                │ │  [Delhi High Court] [IP Appellate Board]  │
│                │                                              │
│                │ PREMIUM SETTINGS (if Premium tier):         │
│                │ ├─ Brand Color:                             │
│                │ │  [Color Picker] Current: #0066CC         │
│                │ │  Preview: [Sample profile with color]    │
│                │ ├─ Email Forwarding:                        │
│                │ │  yourname@toplawyer.in → [email@gmail]   │
│                │ ├─ Logo/Brand Name:                         │
│                │ │  [Upload] [Text input]                    │
│                │ ├─ Custom Domain (CNAME):                   │
│                │ │  [gupta-legal.com] [Setup CNAME]         │
│                │                                              │
│                │ [Save Changes] [Preview Profile]            │
│                │                                              │
└────────────────┴──────────────────────────────────────────────┘

ANALYTICS TAB (Premium tier):

┌──────────────────────────────────────────────────────────────┐
│ ANALYTICS — This Month (September 2024)                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ PERFORMANCE SUMMARY:                                         │
│ ┌─────────────────┬─────────────────┬────────────────────┐  │
│ │ Profile Views   │ WhatsApp Clicks │ Call Button Clicks │  │
│ │     127         │        12       │        8           │  │
│ └─────────────────┴─────────────────┴────────────────────┘  │
│                                                              │
│ TRAFFIC SOURCE BREAKDOWN:                                   │
│ Google Search:  60% (77 views)                              │
│ Direct:         25% (32 views)                              │
│ Organic:        15% (18 views)                              │
│                                                              │
│ GEOGRAPHIC BREAKDOWN:                                       │
│ Delhi:     45% (57 views)                                   │
│ Gurgaon:   25% (32 views)                                   │
│ Bangalore: 20% (25 views)                                   │
│ Other:     10% (13 views)                                   │
│                                                              │
│ [Export Report] [Download PDF] [Email Summary]              │
│                                                              │
└──────────────────────────────────────────────────────────────┘

================================================================================
COLOR CUSTOMIZATION SYSTEM (Premium Tier)
================================================================================

DEFAULT COLORS (Free tier, system-set):
┌──────────────────────────────────────────────────────────────┐
│ LAWYERS:                    CAs:                 TAX EXPERTS: │
│ Primary: #0066CC (Blue)     Primary: #2D7C4A    Primary: #E67E22
│ Secondary: #004499          Secondary: #1F4A2C   Secondary: #D35400
│ Accent: #66B3FF             Accent: #5ABA77      Accent: #F39C12
│                                                              │
│ Used for:                                                    │
│ • Primary buttons (WhatsApp CTA)                            │
│ • Heading accents                                           │
│ • Link colors, badge backgrounds                           │
│ • Border accents                                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘

PROFESSIONAL BRAND COLOR PICKER (Premium tier):
┌──────────────────────────────────────────────────────────────┐
│ Choose Your Brand Color:                                     │
│                                                              │
│ [Color Picker Widget — HTML5 Input Range]                   │
│ Selected: [Show current color swatch]                        │
│ Hex: #FF6B35  [Copy to clipboard]                           │
│                                                              │
│ PREVIEW:                                                     │
│ ┌────────────────────────────────────┐                      │
│ │ Profile Preview with Your Color:   │                      │
│ │                                    │                      │
│ │ [WhatsApp] [Call] [Email]          │ ← Buttons in color  │
│ │ • IP Law  • Patent  • Trademark    │ ← Badges in color   │
│ │                                    │                      │
│ │ [Read More] [View All Cases]       │ ← Links in color    │
│ └────────────────────────────────────┘                      │
│                                                              │
│ [Confirm Color] [Reset to Default]                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘

================================================================================
MOBILE-FIRST RESPONSIVE DESIGN BREAKPOINTS
================================================================================

BREAKPOINTS:
• Mobile: 375px (iPhone 12 mini) - 430px (baseline for India)
• Tablet: 768px (iPad mini)
• Desktop: 1024px+ (laptop/desktop)

RESPONSIVE RULES:
├─ 375-430px (Mobile):
│  ├─ Hero photo: full width, 200-250px tall (9:16 aspect)
│  ├─ Navigation: hamburger menu, sticky
│  ├─ Text: 16px base (iPhone min font size), 24px headings
│  ├─ Buttons: full width or 2-column grid (WhatsApp | Call)
│  └─ Spacing: 16px margins, 12px padding
│
├─ 768px (Tablet):
│  ├─ Hero photo: left-aligned, 250-350px tall
│  ├─ Content: 2-column grid (photo + info side-by-side)
│  ├─ Navigation: tabs or side menu
│  └─ Spacing: 20px margins
│
└─ 1024px+ (Desktop):
   ├─ Hero photo: left sidebar, 400-500px tall
   ├─ Content: 2-3 column layout (hero + info + sidebar)
   ├─ Navigation: horizontal top menu
   └─ Spacing: 24px margins, max-width 1200px container

IMAGES:
• Hero photo: responsive, lazy-loaded, WebP + PNG fallback
• Srcset: 1x (375px), 2x (750px), 3x (1125px)
• Alt text: "J. Gupta, IP Lawyer in Delhi"
• Compression: JPEG 85% quality for mobile, 90% for desktop

================================================================================
TYPOGRAPHY & TEXT HIERARCHY
================================================================================

FONT STACK (Indian-friendly):
• Headings (H1, H2, H3): Inter, -apple-system, BlinkMacSystemFont, sans-serif
• Body text: Segoe UI, -apple-system, BlinkMacSystemFont, sans-serif
• Fallback: System fonts (no external font load on 3G to save bandwidth)

SIZE SCALE (Mobile → Desktop):
┌─────────────────┬──────────┬──────────┐
│ Element         │ Mobile   │ Desktop  │
├─────────────────┼──────────┼──────────┤
│ H1 (Name)       │ 28px     │ 48px     │
│ H2 (Section)    │ 20px     │ 32px     │
│ H3 (Subsection) │ 18px     │ 24px     │
│ Body text       │ 16px     │ 16px     │
│ Small text      │ 14px     │ 14px     │
│ Micro text      │ 12px     │ 12px     │
└─────────────────┴──────────┴──────────┘

LINE HEIGHT:
• Headings: 1.2 (tight, professional)
• Body: 1.6 (readable, accessible)

LETTER SPACING:
• Headings: -0.5px (confident, tight)
• Body: 0.25px (comfortable)

COLOR TEXT:
• Primary: #222222 (dark gray, not pure black for screen comfort)
• Secondary: #666666 (lighter, for meta info)
• Accent: Use primary brand color for important text

================================================================================
SAMPLE PROFILE CONTENT (Ready for Design)
================================================================================

VERTICAL 1: LAWYER PROFILE
────────────────────────────────────────────────────────────────────────

NAME: J. Gupta
SPECIALIZATION: IP Law Specialist
RATING: 4.8★ (12 reviews)

HERO PHOTO: [Sample lawyer portrait - professional formal photo, confident pose]
Brand Color (if Premium): #0066CC (blue)

BIO:
"I am an IP lawyer with 10+ years of experience in intellectual property law, 
specializing in patents, trademarks, and copyrights. I have successfully handled 
100+ cases across Delhi High Court and IP Appellate Board."

EXPERTISE TAGS:
• Intellectual Property Law
• Patent Law
• Trademark Law
• Copyright Law
• Trade Secrets

COURTS OF PRACTICE:
• Delhi High Court
• IP Appellate Board

CASE OUTCOMES (3-5 featured):
1) Patent Infringement Dispute
   "Represented a technology startup in a patent infringement case against a competing firm."
   Outcome: Favorable judgment for client; preliminary injunction granted
   Court: Delhi High Court | Date: 2023 | Case Type: IP

2) Trademark Opposition
   "Opposed a trademark application that was similar to our client's registered mark."
   Outcome: Opposition sustained; application rejected by IP Appellate Board
   Court: IP Appellate Board | Date: 2022 | Case Type: Trademark

3) Copyright Infringement
   "Secured copyright protection and pursued infringement damages against unauthorized users."
   Outcome: Favorable settlement for our client; damages awarded
   Court: Delhi High Court | Date: 2021 | Case Type: Copyright

REVIEWS (sample):
⭐⭐⭐⭐⭐ "Excellent service, very responsive, detailed explanations" — Anonymous (2 months ago)
⭐⭐⭐⭐⭐ "Highly knowledgeable in IP law, helped us secure patents" — Anonymous (1 month ago)
⭐⭐⭐⭐☆ "Good guidance, but could have communicated more frequently" — Anonymous (3 weeks ago)
⭐⭐⭐⭐⭐ "Professional approach, delivered results on time" — Anonymous (2 weeks ago)

CONTACT INFO:
• Phone: +91-98765-43210
• Email: jgupta@email.com
• WhatsApp: +91-98765-43210
• Office: 45 Rajendra Place, New Delhi 110008

────────────────────────────────────────────────────────────────────────

VERTICAL 2: CHARTERED ACCOUNTANT (CA) PROFILE
────────────────────────────────────────────────────────────────────────

NAME: Ravi Sharma
SPECIALIZATION: Audit & Tax Advisory
RATING: 4.7★ (18 reviews)

HERO PHOTO: [Sample CA portrait - professional formal photo, confident pose]
Brand Color (if Premium): #2D7C4A (green)

BIO:
"I am a Chartered Accountant with 12+ years of experience in audit, taxation, 
and financial advisory. I specialize in helping businesses with GST compliance, 
income tax planning, and financial statement preparation."

EXPERTISE TAGS:
• Audit & Assurance
• Income Tax Advisory
• GST Consulting
• Financial Planning
• Corporate Tax

FIRM AFFILIATION:
• Sharma & Associates, New Delhi
• Partner

CLIENT SECTORS:
• IT / Software Services
• Manufacturing
• Trading & Distribution
• Professional Services

CASE STUDIES (sample):
1) GST Compliance Overhaul
   "Helped a manufacturing firm restructure its GST compliance and reduce tax liability."
   Result: Saved client ₹45 lakhs in annual tax through proper GST classification
   Year: 2023 | Industry: Manufacturing

2) Income Tax Optimization
   "Designed tax-efficient structure for a professional services firm."
   Result: Reduced tax liability by 35% through strategic income planning
   Year: 2022 | Industry: Professional Services

REVIEWS (sample):
⭐⭐⭐⭐⭐ "Highly professional, saved us significant tax liability" — Anonymous (1 month ago)
⭐⭐⭐⭐⭐ "Expert in GST matters, very reliable" — Anonymous (2 weeks ago)
⭐⭐⭐⭐☆ "Good service, bit slow on communication" — Anonymous (3 weeks ago)

CONTACT INFO:
• Phone: +91-98765-43210
• Email: ravi@sharmaca.com
• WhatsApp: +91-98765-43210
• Office: Sharma & Associates, MG Road, Bangalore 560001

────────────────────────────────────────────────────────────────────────

VERTICAL 3: TAX PRACTITIONER PROFILE
────────────────────────────────────────────────────────────────────────

NAME: Priya Iyer
SPECIALIZATION: Income Tax & GST Consultant
RATING: 4.9★ (22 reviews)

HERO PHOTO: [Sample tax professional portrait - professional formal photo]
Brand Color (if Premium): #E67E22 (orange)

BIO:
"I am a certified Income Tax practitioner with 8+ years of experience in tax 
compliance and advisory. I help individuals and businesses navigate complex 
tax laws and optimize their tax positions."

EXPERTISE TAGS:
• Income Tax Compliance
• GST Advisory
• Customs Clearance
• TDS Compliance
• Tax Planning

SPECIALIZATIONS:
• Self-employed professionals (doctors, lawyers, CAs)
• Trading & e-commerce businesses
• Export-import operations

CASE STUDIES (sample):
1) e-Commerce GST Setup
   "Helped an e-commerce startup set up GST registration and compliance processes."
   Result: Fully compliant operations, no audit issues, saved ₹10 lakhs in penalties
   Year: 2023

2) Export Customs Clearance
   "Guided an export-import company through customs clearance processes."
   Result: Reduced clearance time from 10 days to 3 days
   Year: 2022

REVIEWS (sample):
⭐⭐⭐⭐⭐ "Expert in tax matters, very responsive" — Anonymous (1 week ago)
⭐⭐⭐⭐⭐ "Saved my business thousands in taxes" — Anonymous (2 weeks ago)
⭐⭐⭐⭐⭐ "Trustworthy and knowledgeable" — Anonymous (1 month ago)

CONTACT INFO:
• Phone: +91-98765-43210
• Email: priya@iyer-tax.com
• WhatsApp: +91-98765-43210
• Office: Tax & Finance Consultants, Brigade Road, Bangalore 560001

================================================================================
COLOR PALETTE REFERENCE
================================================================================

VERTICAL-SPECIFIC DEFAULT COLORS:

LAWYERS:
┌───────────────────┬──────────┬────────────────┐
│ Element           │ Color    │ Hex Code       │
├───────────────────┼──────────┼────────────────┤
│ Primary Button    │ Blue     │ #0066CC        │
│ Secondary         │ Dark Blue│ #004499        │
│ Accent            │ Lt Blue  │ #66B3FF        │
│ Background        │ White    │ #FFFFFF        │
│ Text Primary      │ Dark Gray│ #222222        │
│ Text Secondary    │ Med Gray │ #666666        │
│ Border            │ Lt Gray  │ #DDDDDD        │
│ Success/Star      │ Gold     │ #FFB400        │
└───────────────────┴──────────┴────────────────┘

CHARTERED ACCOUNTANTS:
┌───────────────────┬──────────┬────────────────┐
│ Element           │ Color    │ Hex Code       │
├───────────────────┼──────────┼────────────────┤
│ Primary Button    │ Green    │ #2D7C4A        │
│ Secondary         │ Dark Grn │ #1F4A2C        │
│ Accent            │ Lt Green │ #5ABA77        │
│ Background        │ White    │ #FFFFFF        │
│ Text Primary      │ Dark Gray│ #222222        │
│ Text Secondary    │ Med Gray │ #666666        │
│ Border            │ Lt Gray  │ #DDDDDD        │
│ Success/Star      │ Gold     │ #FFB400        │
└───────────────────┴──────────┴────────────────┘

TAX PROFESSIONALS:
┌───────────────────┬──────────┬────────────────┐
│ Element           │ Color    │ Hex Code       │
├───────────────────┼──────────┼────────────────┤
│ Primary Button    │ Orange   │ #E67E22        │
│ Secondary         │ Dark Org │ #D35400        │
│ Accent            │ Lt Orange│ #F39C12        │
│ Background        │ White    │ #FFFFFF        │
│ Text Primary      │ Dark Gray│ #222222        │
│ Text Secondary    │ Med Gray │ #666666        │
│ Border            │ Lt Gray  │ #DDDDDD        │
│ Success/Star      │ Gold     │ #FFB400        │
└───────────────────┴──────────┴────────────────┘

PREMIUM TIER COLOR CUSTOMIZATION:
• Professional picks primary color (via HTML5 color picker)
• System automatically adjusts:
  - Button colors (CTA buttons use primary color)
  - Heading accents
  - Badge backgrounds
  - Link hover states
  - Border accents
  - Icon colors

CNAME WHITE-LABEL:
• Same color customization as Premium
• Plus: Option to set background color, border radius (rounded vs. sharp corners)
• Complete visual control

================================================================================
VISUAL ELEMENTS & COMPONENTS
================================================================================

BUTTONS:
┌─────────────────────────────────────────────────────────┐
│ PRIMARY (WhatsApp CTA):                                 │
│ ┌────────────────────┐                                  │
│ │ 💬 WhatsApp Chat   │ ← Bright primary color          │
│ └────────────────────┘                                  │
│ State: hover (darkened), active (pressed), disabled     │
│                                                         │
│ SECONDARY (Call, Email):                               │
│ ┌──────────┬──────────┐                                │
│ │ 📞 Call  │ 📧 Email │ ← Secondary color or outline  │
│ └──────────┴──────────┘                                │
│                                                         │
│ TERTIARY (View All, Learn More):                        │
│ [View All Cases →] ← Underlined link, primary color   │
│                                                         │
└─────────────────────────────────────────────────────────┘

BADGES & PILLS:
┌─────────────────────────────────────────────────────────┐
│ EXPERTISE TAGS:                                         │
│ [IP Law] [Patent] [Trademark] ← Pill shape, light bg  │
│                                                         │
│ VERIFIED BADGE:                                        │
│ ✓ Verified (Email/Phone/Admin) ← Checkmark icon       │
│                                                         │
│ RATING STARS:                                          │
│ ⭐⭐⭐⭐⭐ 4.8 (12 reviews) ← Gold stars, clickable    │
│                                                         │
│ CASE OUTCOME TAG:                                      │
│ [Favorable] [Dismissed] [Settled] ← Color-coded       │
│                                                         │
└─────────────────────────────────────────────────────────┘

CARDS & CONTAINERS:
┌─────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Case Study Card (White bg, light border)            │ │
│ │ Title: "Patent Infringement Dispute"                │ │
│ │ Description: "Represented startup..."               │ │
│ │ Outcome: [Green badge] Favorable                    │ │
│ │ Metadata: Delhi HC | 2023 | IP Law                 │ │
│ │                                                     │ │
│ │ [Read Full Case]                                    │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Review Card:                                           │
│ ⭐⭐⭐⭐⭐ "Very responsive and knowledgeable"          │
│ — Anonymous (2 months ago)                            │
│                                                         │
│ Analytics Card:                                        │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 127 Profile Views This Month                         │ │
│ │ ▁▂▃▄▅▆▇ [Mini chart showing trend]                │ │
│ │ +15% from last month                                │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘

ICONS:
• WhatsApp: 💬 (or custom icon)
• Phone: 📞
• Email: 📧
• Star: ⭐
• Verified: ✓
• External link: → (arrow)
• Menu: ☰ (hamburger on mobile)

================================================================================
INDIAN MARKET CONSIDERATIONS
================================================================================

1. DESIGN AESTHETICS
   ✓ Warm colors preferred (blues, greens, golds)
   ✓ Professional formality (legal/finance professionals expect conservatism)
   ✓ Photo-first culture (professionals want their photo prominent)
   ✓ Credibility signaling (trust badges, verification, reviews matter)
   ✓ Avoid: Playful, casual, or "fun" design language

2. LANGUAGE & TEXT
   ✓ Support for mixed Hindi/English (e.g., "Advocate" vs. "Lawyer")
   ✓ Local terminology (e.g., "Delhi High Court", "Tribunal", "GST")
   ✓ Respectful, formal tone
   ✓ No slangy language

3. MOBILE-FIRST
   ✓ Assume 4G/3G networks (optimize image loads, lazy load)
   ✓ 375px base screen size (lower end of smartphone spectrum in India)
   ✓ Thumb-friendly navigation (CTAs in thumb-reachable zones)
   ✓ Avoid: large page sizes, auto-playing videos, heavy animations

4. ACCESSIBILITY
   ✓ High contrast text (dark gray on white, not light gray)
   ✓ Large touch targets (44px minimum for buttons)
   ✓ Alt text on images (for screen readers, also SEO)
   ✓ Clear heading hierarchy (H1, H2, H3 for semantic HTML)

5. CONVERSION OPTIMIZATION
   ✓ Prominent WhatsApp CTA (most used in India)
   ✓ Phone button above-fold
   ✓ Quick contact method (no forms, just click-to-call/click-to-WhatsApp)
   ✓ Clear value proposition (expertise, specializations, reviews upfront)

================================================================================
DESIGN DELIVERABLES CHECKLIST
================================================================================

FIGMA/DESIGN FILES NEEDED:

□ Frame 1: Mobile - Free Tier Profile Page (375px)
□ Frame 2: Mobile - Premium Tier Profile Page (375px)
□ Frame 3: Mobile - CNAME White-Label Profile (375px)
□ Frame 4: Tablet - Free Tier (768px)
□ Frame 5: Tablet - Premium Tier (768px)
□ Frame 6: Desktop - Free Tier (1200px)
□ Frame 7: Desktop - Premium Tier (1200px)
□ Frame 8: Desktop - CNAME White-Label (1200px)

□ Frame 9: Professional Dashboard - Profile Editor
□ Frame 10: Professional Dashboard - Analytics Tab
□ Frame 11: Professional Dashboard - Settings Tab (Color Picker)

□ Frame 12: Color Customization Preview (showing dynamic color changes)
□ Frame 13: Component Library (buttons, badges, cards, icons)
□ Frame 14: Typography Scale (headings, body text, sizes)

INTERACTIVE FEATURES:
□ Color picker interaction (professional selects color, preview updates)
□ Hover states (buttons, links, cards)
□ Responsive breakpoint transitions (mobile → tablet → desktop)
□ Navigation menu (mobile hamburger, desktop horizontal)

================================================================================
NEXT STEPS FOR DESIGNER
================================================================================

1. Review this brief and confirm understanding of:
   - Three-tier UX (Free, Premium, CNAME)
   - 60% generic + 40% unique content split
   - Hero image-first layout
   - Customizable color theming

2. Create Figma designs for all 14 frames (listed above)

3. Build interactive prototypes showing:
   - Color customization (professional picks color, site updates dynamically)
   - Responsive behavior (mobile → desktop transitions)
   - Competitor hiding (Free tier shows competitors, Premium tier hides them)

4. Include sample content from the three verticals (Lawyer, CA, Tax)

5. Finalize color palette and component library

6. Hand off to development team for HTML/CSS/React implementation

================================================================================
END OF DESIGN PROMPT
================================================================================

This prompt is ready for senior UI/UX designer to create high-fidelity designs.
All information provided. No additional details needed from product owner.
