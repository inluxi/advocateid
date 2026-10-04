# AdvocateID prototype v2 (MVP 1 only): notes

Unzip, open `index.html`, and use the **Prototype pages** button (bottom left) to move between pages. It also shows the live-site route of the page you are on. Every page is responsive. All people, firms, courts and court updates are made-up samples. The look is a placeholder until the Claude Design style guide is ready.

## Assumptions I made (please correct)

| ID | Assumption |
|---|---|
| A1 | Look and feel: ink navy, seal maroon, brass and parchment, serif headings. Your Claude Design style guide will replace it. |
| A2 | People, firms, courts and court updates are made-up samples. Images are drawn placeholders. |
| A3 | Search results are sorted by relevance and never by plan. Paid pages get a brass edge only. When you arrive from a practice-area click, the source page is first with a small "You came from this page" mark. |
| A4 | No Verified seal anywhere. The enrolment number is mandatory for an advocate page, shown on the profile as "declared by the advocate", and hidden on the compare page. |
| A5 | Indexable: district, district + practice area, court, court + practice area, location, location + practice area. Everything else (filters, sort, pages beyond 5) is noindex with a canonical link to the base page. |
| A6 | Court page tabs: Overview, Advocates (filters), Newly joined, Updates and posts. Case status search is not in MVP 1. A missing court is requested through the contact page. |
| A7 | Admin writes official court updates in the back office. Any page can also contribute one: court and source link are mandatory, it is published at once, credited to the author, and can be reported. Contributions raise the author's score. |
| A8 | Compare: advocates and firms can be mixed (up to 3), with a remove button. It shows facts only: no enrolment number, no verified mark, no ratings, no fees. Cells that do not apply say "Not applicable". |
| A9 | Bookmarks are kept in the browser for visitors and merged into the account after login. |
| A10 | Language is in the URL (/ml/...). Malayalam content starts with courts, locations, categories and court updates. UI text stays English until MVP 2. |
| A11 | No reviews, no ratings, no jobs, no analytics dashboard in MVP 1. |
| A12 | Basic pages show both "Other advocates nearby" and "Similar advocates". Counsel should confirm this is acceptable. |
| A13 | Professional page: banner and profile picture, bio (500 characters) and About (5,000), up to 4 highlights, 5 link icons, tabs, competitors hidden. |
| A14 | Premium pages look like the owner's own website. All links stay on the custom domain. The only link to advocateid.in is the small legal footer. |
| A15 | Premium colour can be any colour that passes a contrast check (4.5:1). |
| A16 | Case summaries: role, court (search and select), year, outcome from a fixed list, optional note, optional link (own post or any reference). Sorted by year. Basic 2, Professional and Premium 10. |
| A17 | Premium limits equal Professional (10 courts, 10 practice areas, 5 offices, 10 career entries) plus a custom domain and unlimited lawyers on a firm page. |
| A18 | Firm pages: Basic lists 1 lawyer and no offices beyond the main one. Professional lists up to 5 lawyers and 5 offices in total. Each lawyer shows photo, title, office and a 200-character intro. |
| A19 | "Office" replaces "branch". Every office has its own page, its own mobile number (OTP, not used to log in), focus courts chosen by the office, latitude and longitude, and a local description. |
| A20 | One mobile login is an account, not a person. Actions are taken as one of your pages. An account can own 3 pages in total, including firm pages. |
| A21 | Admin assigns plans in MVP 1. Plan prices include GST: Professional Rs 599 or Rs 6,000 a year, Premium Rs 999 or Rs 10,000 a year. Online payment comes later. |
| A22 | The editor is the page itself in edit mode. Desktop uses a side panel; phones use a bottom sheet and a shortcut bar. Lists reorder with arrows (drag on desktop). |
| A23 | On downgrade, the first items in the owner's order stay visible and the rest are hidden, not deleted. |
| A24 | Page address: 5 to 30 characters, a-z, digits, hyphen. One change every 90 days; old address redirects for 12 months; a deleted page's address is reserved for 90 days. AdvocateID can suspend, cancel or recall an address, with or without notice. |
| A25 | Custom domain: the owner points a CNAME to {page}.p.advocateid.in (hidden from search engines). Use www or a host with CNAME flattening for bare domains. If the domain lapses, advocateid.in/{page} keeps working. |
| A26 | Views, impressions and Connect taps are recorded separately for advocateid.in and each custom domain. Nothing is shown to users in MVP 1. |
| A27 | Page completeness is shown to the owner only and feeds ranking. |
| A28 | /post/{id} is a neutral discovery page. The /posts?author=&category= page shows the author's latest post in a category, their other posts, and snapshots of similar latest posts from others. It is noindex. |
| A29 | Premium canonical: the custom domain. advocateid.in/{page} stays usable and searchable inside the site but is excluded from search engines once a domain is active. |
| A30 | Legal pages are placeholder text. Counsel writes the real ones. |
| A31 | Practice-area click: Basic goes to search (source first); Professional goes to the author's posts page for that category; Premium on its own domain stays on the domain. |
| A32 | Lawyers on a firm are ordered by the owner with arrows, at firm level and office level. |
| A33 | Link icons: known sites use their icon; other sites use their favicon fetched automatically. |
| A34 | The site is an installable app (PWA). Photos are resized on the phone and uploaded in the background. |
| A35 | Anyone can report a page, post or update without logging in (captcha). Admin can suspend a page, post or update. |

## Pages and routes

### Public

| File | Page | Route |
|---|---|---|
| `index.html` | Home | `/` |
| `search.html` | Search (all filters, near me included) | `/search?d=&q=&p=&c=&l=&g=&x=&t=&s=&n=&first=  (noindex)` |
| `location.html` | Location page | `/l/{id}/{location-city-locale-seo}` |
| `location-practice.html` | Location and practice area | `/l/{id}/{location-seo}/{practice-slug}` |
| `court.html` | Court page | `/c/{id}/{court-name-location-seo}` |
| `court-updates.html` | Court updates list | `/c/{id}/{court-seo}/updates` |
| `update.html` | Court update article | `/u/{id}/{update-title-seo}` |
| `practice-index.html` | Practice areas index | `/practice` |
| `practice.html` | Practice area page | `/practice/{category-slug}` |
| `compare.html` | Compare (advocates and firms) | `/compare?a=&b=&c=  (noindex)` |
| `post.html` | Post (global discovery page) | `/post/{id}/{post-title-seo}` |
| `posts.html` | Posts by author and category (Professional practice-area click) | `/posts?author={pageId}&category={code}  (noindex)` |

### Profiles

| File | Page | Route |
|---|---|---|
| `profile-pro.html` | Advocate page: Professional plan | `/{profile-slug}  (tabs: /posts, /offices)` |
| `profile-basic.html` | Advocate page: Basic plan | `/{profile-slug}` |
| `firm.html` | Law firm page (Professional) | `/{profile-slug}  (tabs: /offices, /lawyers, /posts)` |
| `office.html` | Office page (firm branch) | `/{profile-slug}/o/{id}/{office-name-location-seo}` |

### Premium site (own domain)

| File | Page | Route |
|---|---|---|
| `profile-premium.html` | Premium: personal site | `rahulnair.in/   (same page at advocateid.in/{slug}, shown as Professional)` |
| `premium-posts.html` | Premium: posts page | `rahulnair.in/posts?category={code}` |
| `premium-firm.html` | Premium: firm site | `menonlaw.in/   (firm Premium)` |
| `premium-lawyer.html` | Premium: lawyer page on a firm domain | `menonlaw.in/lawyers/{name}` |

### Info

| File | Page | Route |
|---|---|---|
| `pricing.html` | Pricing | `/pricing` |
| `login.html` | Log in / sign up | `/login` |
| `about.html` | About | `/about` |
| `contact.html` | Contact | `/contact` |
| `terms.html` | Terms of use | `/terms` |
| `privacy.html` | Privacy | `/privacy` |
| `grievance.html` | Grievance officer | `/grievance` |
| `report.html` | Report content | `/report` |

### Account

| File | Page | Route |
|---|---|---|
| `account.html` | Dashboard (after login) | `/account` |
| `account-bookmarks.html` | Bookmarks | `/account/bookmarks` |
| `account-settings.html` | Settings | `/account/settings` |

### Manage

| File | Page | Route |
|---|---|---|
| `manage-new.html` | Create a page | `/manage/new` |
| `manage-edit.html` | Page editor: advocate (edit as it looks) | `/manage/{pageId}` |
| `manage-edit-firm.html` | Page editor: firm | `/manage/{pageId}  (firm)` |
| `manage-associates.html` | Lawyers (firm) | `/manage/{pageId}/associates` |
| `manage-posts.html` | Posts and court updates | `/manage/{pageId}/posts` |
| `manage-plan.html` | Plan | `/manage/{pageId}/plan` |
| `manage-domain.html` | Custom domain | `/manage/{pageId}/domain` |
| `manage-slug.html` | Page address | `/manage/{pageId}/slug` |
| `manage-offices.html` | Offices | `/manage/{pageId}/offices` |

## Removed from this version (not MVP 1)
`i.html` (bar association), `near-me.html` (merged into search), jobs pages (3), `account-applications.html`, `account-billing.html`, `manage-jobs.html`, `manage-analytics.html`, `manage-verify.html`. `branch.html` became `office.html`; `manage-branches.html` became `manage-offices.html`.

## Pages reworked in this version
court, court-updates, update, location-practice, search, compare, post, posts (new), profile-basic, profile-pro, profile-premium, premium-posts / premium-firm / premium-lawyer (new), firm, office, pricing, account (dashboard), manage-new, manage-edit, manage-edit-firm, manage-offices, manage-associates, manage-posts, manage-plan, manage-domain, manage-slug. All advocate cards changed: no Verified seal, no "View profile", green Connect.

## Not reworked (small changes only)
index, location, practice-index, practice, login, about, contact, terms, privacy, grievance, report.

## Open questions for the next iteration
See section 14 of `PROJECT_REQUIREMENTS_v6.md`.
