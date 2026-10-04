/**
 * Database schema (Drizzle, Postgres).
 *
 * Portability rules (AGENTS.md section 6):
 *  - no Postgres-only column types (no arrays, jsonb, enums); code lists are
 *    stored as delimited text (",kl,tvm,") and matched with LIKE;
 *  - every table holding personal or user data has deleted_at / deleted_by;
 *  - every list has `sort`.
 */
import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

const id = () => integer().primaryKey().generatedAlwaysAsIdentity();
const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });
const createdAt = () => ts("created_at").notNull().defaultNow();
const updatedAt = () => ts("updated_at").notNull().defaultNow();
const softDelete = () => ({
  deletedAt: ts("deleted_at"),
  deletedBy: text("deleted_by"),
});

/* ---------------------------------------------------------------- accounts */

export const accounts = pgTable(
  "accounts",
  {
    id: id(),
    mobile: varchar("mobile", { length: 16 }).notNull(),
    status: varchar("status", { length: 16 }).notNull().default("active"), // active | suspended | deleted
    role: varchar("role", { length: 16 }).notNull().default("user"), // user | admin
    // DPDP: set when the owner asks to delete; hard delete 30 days later
    deletionRequestedAt: ts("deletion_requested_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    ...softDelete(),
  },
  (t) => [uniqueIndex("accounts_mobile_uq").on(t.mobile)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: id(),
    accountId: integer("account_id").notNull(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    actingPageId: integer("acting_page_id"),
    createdAt: createdAt(),
    expiresAt: ts("expires_at").notNull(),
    lastSeenAt: ts("last_seen_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("sessions_token_uq").on(t.tokenHash), index("sessions_account_idx").on(t.accountId)],
);

export const otpLogs = pgTable(
  "otp_logs",
  {
    id: id(),
    mobileHash: varchar("mobile_hash", { length: 64 }).notNull(),
    otpHash: varchar("otp_hash", { length: 64 }).notNull(),
    purpose: varchar("purpose", { length: 24 }).notNull().default("login"), // login | contact | office
    subjectId: integer("subject_id"), // page or office id for contact/office purposes
    attempts: integer("attempts").notNull().default(0),
    createdAt: createdAt(),
    expiresAt: ts("expires_at").notNull(),
    consumedAt: ts("consumed_at"),
    deletedAt: ts("deleted_at"),
  },
  (t) => [index("otp_logs_mobile_idx").on(t.mobileHash)],
);

/** Rate limit buckets keyed by a one-way hash (never a raw IP or mobile). */
export const rateLimits = pgTable(
  "rate_limits",
  {
    keyHash: varchar("key_hash", { length: 64 }).notNull(),
    bucket: varchar("bucket", { length: 32 }).notNull(),
    count: integer("count").notNull().default(0),
    windowStart: ts("window_start").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.keyHash, t.bucket] })],
);

export const accountConsents = pgTable(
  "account_consents",
  {
    id: id(),
    accountId: integer("account_id").notNull(),
    type: varchar("type", { length: 32 }).notNull(), // mobile_login | terms | office_phone
    noticeVersion: varchar("notice_version", { length: 16 }).notNull().default("1"),
    consentedAt: ts("consented_at").notNull().defaultNow(),
    withdrawnAt: ts("withdrawn_at"),
    deletedAt: ts("deleted_at"),
  },
  (t) => [index("consents_account_idx").on(t.accountId)],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: id(),
    action: varchar("action", { length: 48 }).notNull(),
    resourceType: varchar("resource_type", { length: 32 }).notNull(),
    resourceId: text("resource_id"),
    actorId: integer("actor_id"),
    actorType: varchar("actor_type", { length: 16 }).notNull().default("admin"),
    reason: text("reason"),
    timestamp: ts("timestamp").notNull().defaultNow(),
  },
  (t) => [index("audit_resource_idx").on(t.resourceType, t.resourceId)],
);

/* --------------------------------------------------------- reference data */

export const localities = pgTable(
  "localities",
  {
    id: id(),
    code: varchar("code", { length: 8 }).notNull(),
    name: text("name").notNull(),
    localName: text("local_name"),
    parentId: integer("parent_id"),
    level: varchar("level", { length: 12 }).notNull(), // state | district | city | locality
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    sort: integer("sort").notNull().default(0),
    ...softDelete(),
  },
  (t) => [uniqueIndex("localities_code_uq").on(t.code), index("localities_parent_idx").on(t.parentId)],
);

export const courts = pgTable(
  "courts",
  {
    id: id(),
    code: varchar("code", { length: 8 }).notNull(),
    importKey: text("import_key"), // id column of the CSV (e.g. KL-HC-001)
    name: text("name").notNull(),
    localName: text("local_name"),
    kind: varchar("kind", { length: 32 }).notNull(),
    localityId: integer("locality_id"),
    districtId: integer("district_id"),
    address: text("address"),
    pincode: varchar("pincode", { length: 10 }),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    website: text("website"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    ...softDelete(),
  },
  (t) => [
    uniqueIndex("courts_code_uq").on(t.code),
    index("courts_district_idx").on(t.districtId),
    index("courts_import_key_idx").on(t.importKey),
  ],
);

export const courtTranslations = pgTable(
  "court_translations",
  {
    courtId: integer("court_id").notNull(),
    language: varchar("language", { length: 5 }).notNull(),
    name: text("name").notNull(),
  },
  (t) => [primaryKey({ columns: [t.courtId, t.language] })],
);

export const courtDetails = pgTable(
  "court_details",
  {
    id: id(),
    courtId: integer("court_id").notNull(),
    sort: integer("sort").notNull().default(0),
    keyName: text("key_name").notNull(),
    value: text("value").notNull(),
    ...softDelete(),
  },
  (t) => [index("court_details_court_idx").on(t.courtId)],
);

export const categories = pgTable(
  "categories",
  {
    id: id(),
    code: varchar("code", { length: 8 }).notNull(),
    slug: varchar("slug", { length: 60 }).notNull(),
    name: text("name").notNull(),
    sort: integer("sort").notNull().default(0),
    ...softDelete(),
  },
  (t) => [uniqueIndex("categories_code_uq").on(t.code), uniqueIndex("categories_slug_uq").on(t.slug)],
);

export const categoryTranslations = pgTable(
  "category_translations",
  {
    categoryId: integer("category_id").notNull(),
    language: varchar("language", { length: 5 }).notNull(),
    name: text("name").notNull(),
  },
  (t) => [primaryKey({ columns: [t.categoryId, t.language] })],
);

/* ------------------------------------------------------------------ pages */

export const pages = pgTable(
  "pages",
  {
    id: id(),
    accountId: integer("account_id").notNull(),
    type: varchar("type", { length: 10 }).notNull(), // advocate | firm
    slug: varchar("slug", { length: 30 }).notNull(),
    name: text("name").notNull(),
    plan: varchar("plan", { length: 12 }).notNull().default("basic"), // basic | professional | premium
    status: varchar("status", { length: 12 }).notNull().default("active"), // active | suspended | deleted
    suspendedReason: text("suspended_reason"),
    districtId: integer("district_id").notNull(),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    bio: text("bio"), // 500
    about: text("about"), // 5000
    language: varchar("language", { length: 5 }).notNull().default("en"),
    photoKey: text("photo_key"),
    bannerKey: text("banner_key"),
    contactMobile: varchar("contact_mobile", { length: 16 }),
    contactVerified: boolean("contact_verified").notNull().default(true),
    completeness: integer("completeness").notNull().default(0),
    score: doublePrecision("score").notNull().default(0),
    slugChangedAt: ts("slug_changed_at"),
    lastActiveAt: ts("last_active_at").notNull().defaultNow(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    ...softDelete(),
  },
  (t) => [
    uniqueIndex("pages_slug_uq").on(t.slug),
    index("pages_district_idx").on(t.districtId),
    index("pages_status_idx").on(t.status),
    index("pages_account_idx").on(t.accountId),
  ],
);

export const pageAdvocate = pgTable(
  "page_advocate",
  {
    pageId: integer("page_id").primaryKey(),
    enrolmentNo: varchar("enrolment_no", { length: 40 }).notNull(),
    yearEnrolled: integer("year_enrolled"),
    ...softDelete(),
  },
  (t) => [index("page_advocate_enrolment_idx").on(t.enrolmentNo)],
);

export const pageFirm = pgTable("page_firm", {
  pageId: integer("page_id").primaryKey(),
  establishedYear: integer("established_year"),
  ...softDelete(),
});

export const pageCustom = pgTable("page_custom", {
  pageId: integer("page_id").primaryKey(),
  brandColour: varchar("brand_colour", { length: 7 }),
  theme: varchar("theme", { length: 16 }).notNull().default("ink"),
  showMemberOf: boolean("show_member_of").notNull().default(true),
  allowMembers: boolean("allow_members").notNull().default(true),
  updatedAt: updatedAt(),
});

export const pageSeo = pgTable("page_seo", {
  pageId: integer("page_id").primaryKey(),
  title: text("title"),
  description: text("description"),
  socialImageKey: text("social_image_key"),
  photoAlt: text("photo_alt"),
  bannerAlt: text("banner_alt"),
  updatedAt: updatedAt(),
});

export const domains = pgTable(
  "domains",
  {
    id: id(),
    pageId: integer("page_id").notNull(),
    hostname: varchar("hostname", { length: 253 }).notNull(),
    status: varchar("status", { length: 12 }).notNull().default("pending"), // pending | active | lapsed | removed
    cloudflareId: text("cloudflare_id"),
    lastCheckedAt: ts("last_checked_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    ...softDelete(),
  },
  (t) => [uniqueIndex("domains_hostname_uq").on(t.hostname), index("domains_page_idx").on(t.pageId)],
);

export const slugHistory = pgTable(
  "slug_history",
  {
    id: id(),
    pageId: integer("page_id"),
    oldSlug: varchar("old_slug", { length: 30 }).notNull(),
    newSlug: varchar("new_slug", { length: 30 }),
    validFrom: ts("valid_from").notNull().defaultNow(),
    // redirect (change) lasts 12 months; reservation (delete/recall) lasts 90 days
    validTo: ts("valid_to").notNull(),
    reason: varchar("reason", { length: 16 }).notNull(), // change | deleted | recalled
  },
  (t) => [index("slug_history_old_idx").on(t.oldSlug), index("slug_history_page_idx").on(t.pageId)],
);

export const pagePhotos = pgTable(
  "page_photos",
  {
    id: id(),
    pageId: integer("page_id").notNull(),
    kind: varchar("kind", { length: 12 }).notNull(), // photo | banner | office | cover
    storageKey: text("storage_key").notNull(),
    sizeBytes: integer("size_bytes"),
    createdAt: createdAt(),
    ...softDelete(),
  },
  (t) => [index("page_photos_page_idx").on(t.pageId)],
);

/* --------------------------------------------------------------- content */

export const pageCourts = pgTable(
  "page_courts",
  {
    id: id(),
    pageId: integer("page_id").notNull(),
    courtId: integer("court_id").notNull(),
    sort: integer("sort").notNull().default(0),
    ...softDelete(),
  },
  (t) => [index("page_courts_page_idx").on(t.pageId), index("page_courts_court_idx").on(t.courtId)],
);

export const pageCategories = pgTable(
  "page_categories",
  {
    id: id(),
    pageId: integer("page_id").notNull(),
    categoryId: integer("category_id").notNull(),
    sort: integer("sort").notNull().default(0),
    ...softDelete(),
  },
  (t) => [index("page_categories_page_idx").on(t.pageId), index("page_categories_cat_idx").on(t.categoryId)],
);

export const pageLanguages = pgTable(
  "page_languages",
  {
    id: id(),
    pageId: integer("page_id").notNull(),
    languageCode: varchar("language_code", { length: 5 }).notNull(),
    sort: integer("sort").notNull().default(0),
    ...softDelete(),
  },
  (t) => [index("page_languages_page_idx").on(t.pageId)],
);

export const careerEntries = pgTable(
  "career_entries",
  {
    id: id(),
    pageId: integer("page_id").notNull(),
    yearFrom: integer("year_from").notNull(),
    yearTo: integer("year_to"), // null = present
    title: text("title").notNull(),
    institution: text("institution"),
    description: text("description"),
    sort: integer("sort").notNull().default(0),
    ...softDelete(),
  },
  (t) => [index("career_page_idx").on(t.pageId)],
);

export const highlights = pgTable(
  "highlights",
  {
    id: id(),
    pageId: integer("page_id").notNull(),
    number: integer("number").notNull(), // up to 3 digits
    label: varchar("label", { length: 20 }).notNull(),
    sort: integer("sort").notNull().default(0),
    ...softDelete(),
  },
  (t) => [index("highlights_page_idx").on(t.pageId)],
);

export const pageLinks = pgTable(
  "page_links",
  {
    id: id(),
    pageId: integer("page_id").notNull(),
    url: text("url").notNull(),
    iconKey: varchar("icon_key", { length: 24 }).notNull().default("link"),
    label: text("label"),
    sort: integer("sort").notNull().default(0),
    ...softDelete(),
  },
  (t) => [index("page_links_page_idx").on(t.pageId)],
);

export const caseSummaries = pgTable(
  "case_summaries",
  {
    id: id(),
    pageId: integer("page_id").notNull(),
    courtId: integer("court_id").notNull(),
    role: text("role").notNull(),
    year: integer("year").notNull(),
    outcome: varchar("outcome", { length: 24 }).notNull(),
    note: text("note"), // 200
    link: text("link"),
    postId: integer("post_id"),
    sort: integer("sort").notNull().default(0),
    ...softDelete(),
  },
  (t) => [index("case_summaries_page_idx").on(t.pageId)],
);

export const offices = pgTable(
  "offices",
  {
    id: id(),
    pageId: integer("page_id").notNull(),
    name: text("name").notNull(),
    isMain: boolean("is_main").notNull().default(false),
    address: text("address"),
    localityId: integer("locality_id"),
    pincode: varchar("pincode", { length: 10 }),
    phone: varchar("phone", { length: 16 }),
    phoneVerified: boolean("phone_verified").notNull().default(false),
    hours: text("hours"),
    about: text("about"), // 200
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    sort: integer("sort").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    ...softDelete(),
  },
  (t) => [index("offices_page_idx").on(t.pageId)],
);

export const officeCourts = pgTable(
  "office_courts",
  {
    id: id(),
    officeId: integer("office_id").notNull(),
    courtId: integer("court_id").notNull(),
    sort: integer("sort").notNull().default(0),
    ...softDelete(),
  },
  (t) => [index("office_courts_office_idx").on(t.officeId)],
);

export const memberships = pgTable(
  "memberships",
  {
    id: id(),
    firmPageId: integer("firm_page_id").notNull(),
    advocatePageId: integer("advocate_page_id").notNull(),
    title: text("title"),
    officeId: integer("office_id"),
    status: varchar("status", { length: 12 }).notNull().default("pending"), // pending | active | rejected | left | removed
    initiatedBy: varchar("initiated_by", { length: 10 }).notNull().default("advocate"),
    firmSort: integer("firm_sort").notNull().default(0),
    officeSort: integer("office_sort").notNull().default(0),
    intro: text("intro"), // 200
    hideOnDomain: boolean("hide_on_domain").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    ...softDelete(),
  },
  (t) => [index("memberships_firm_idx").on(t.firmPageId), index("memberships_advocate_idx").on(t.advocatePageId)],
);

/* ----------------------------------------------------------------- posts */

export const posts = pgTable(
  "posts",
  {
    id: id(),
    pageId: integer("page_id"), // null = official court update written by admin
    type: varchar("type", { length: 16 }).notNull(), // article | court_update
    title: text("title").notNull(),
    body: text("body").notNull(),
    coverImageKey: text("cover_image_key"),
    sourceUrl: text("source_url"),
    courtId: integer("court_id"),
    language: varchar("language", { length: 5 }).notNull().default("en"),
    status: varchar("status", { length: 12 }).notNull().default("published"), // published | suspended
    suspendedReason: text("suspended_reason"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    ...softDelete(),
  },
  (t) => [
    index("posts_page_idx").on(t.pageId),
    index("posts_court_idx").on(t.courtId),
    index("posts_type_status_idx").on(t.type, t.status),
  ],
);

export const postCategories = pgTable(
  "post_categories",
  {
    postId: integer("post_id").notNull(),
    categoryId: integer("category_id").notNull(),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.postId, t.categoryId] }), index("post_categories_cat_idx").on(t.categoryId)],
);

/* ------------------------------------------------------- moderation / legal */

export const reports = pgTable(
  "reports",
  {
    id: id(),
    targetType: varchar("target_type", { length: 12 }).notNull(), // page | post | update
    targetId: integer("target_id").notNull(),
    reason: varchar("reason", { length: 32 }).notNull(),
    details: text("details"),
    status: varchar("status", { length: 12 }).notNull().default("open"), // open | actioned | dismissed
    createdAt: createdAt(),
    resolvedAt: ts("resolved_at"),
    resolvedBy: text("resolved_by"),
  },
  (t) => [index("reports_status_idx").on(t.status)],
);

export const grievances = pgTable("grievances", {
  id: id(),
  name: text("name").notNull(),
  contact: text("contact").notNull(), // needed to reply; purged after 3 years
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: varchar("status", { length: 12 }).notNull().default("open"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const contactMessages = pgTable("contact_messages", {
  id: id(),
  kind: varchar("kind", { length: 16 }).notNull().default("general"), // general | court_request
  name: text("name").notNull(),
  contact: text("contact").notNull(),
  message: text("message").notNull(),
  createdAt: createdAt(), // purged after 90 days
});

export const bookmarks = pgTable(
  "bookmarks",
  {
    id: id(),
    accountId: integer("account_id").notNull(),
    pageId: integer("page_id").notNull(),
    createdAt: createdAt(),
    ...softDelete(),
  },
  (t) => [index("bookmarks_account_idx").on(t.accountId)],
);

/* ------------------------------------------------------- analytics events */

export const pageEventsRaw = pgTable(
  "page_events_raw",
  {
    id: id(),
    pageId: integer("page_id").notNull(),
    host: varchar("host", { length: 253 }).notNull(),
    visitorId: varchar("visitor_id", { length: 64 }).notNull(), // rotating random id, never IP or mobile
    eventType: varchar("event_type", { length: 12 }).notNull(), // impression | view | connect
    context: varchar("context", { length: 24 }), // search | similar | feed | court | location | ...
    action: varchar("action", { length: 12 }), // whatsapp | call
    isOwner: boolean("is_owner").notNull().default(false),
    isBot: boolean("is_bot").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index("events_raw_created_idx").on(t.createdAt), index("events_raw_page_idx").on(t.pageId)],
);

export const pageDailyEvents = pgTable(
  "page_daily_events",
  {
    id: id(),
    pageId: integer("page_id").notNull(),
    host: varchar("host", { length: 253 }).notNull(),
    day: varchar("day", { length: 10 }).notNull(), // YYYY-MM-DD (UTC)
    impressions: integer("impressions").notNull().default(0), // cleaned
    views: integer("views").notNull().default(0), // cleaned, one visitor once a day
    connects: integer("connects").notNull().default(0), // cleaned
    rawImpressions: integer("raw_impressions").notNull().default(0),
    rawViews: integer("raw_views").notNull().default(0),
    rawConnects: integer("raw_connects").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("daily_events_uq").on(t.pageId, t.host, t.day), index("daily_events_day_idx").on(t.day)],
);

export const pageScores = pgTable("page_scores", {
  pageId: integer("page_id").primaryKey(),
  quality: doublePrecision("quality").notNull().default(0),
  updatedAt: updatedAt(),
});

/* ----------------------------------------------------------- search index */

export const searchIndex = pgTable(
  "search_index",
  {
    id: id(),
    pageId: integer("page_id").notNull(),
    officeId: integer("office_id"),
    type: varchar("type", { length: 8 }).notNull(), // page | office
    kind: varchar("kind", { length: 10 }).notNull(), // advocate | firm | office
    districtCode: varchar("district_code", { length: 8 }).notNull(),
    localityCodes: text("locality_codes").notNull().default(","),
    categoryCodes: text("category_codes").notNull().default(","),
    courtCodes: text("court_codes").notNull().default(","),
    languageCodes: text("language_codes").notNull().default(","),
    years: integer("years").notNull().default(0), // years of experience
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    score: doublePrecision("score").notNull().default(0),
    searchText: text("search_text").notNull().default(""),
    createdPage: ts("created_page").notNull().defaultNow(),
    lastActive: ts("last_active").notNull().defaultNow(),
    hasLocation: boolean("has_location").notNull().default(false),
    indexable: boolean("indexable").notNull().default(true),
  },
  (t) => [
    index("search_district_idx").on(t.districtCode),
    index("search_latlng_idx").on(t.lat, t.lng),
    index("search_page_idx").on(t.pageId),
  ],
);

export type Schema = typeof import("./schema");
