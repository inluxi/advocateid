import { and, asc, desc, eq, gt, inArray, isNull, ne, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  accounts,
  careerEntries,
  caseSummaries,
  courts,
  domains,
  highlights,
  officeCourts,
  offices,
  pageAdvocate,
  pageCategories,
  pageCourts,
  pageCustom,
  pageFirm,
  pageLanguages,
  pageLinks,
  pageSeo,
  pages,
  searchIndex,
  slugHistory,
  memberships,
  posts,
} from "@/db/schema";
import {
  MAX_PAGES_PER_ACCOUNT,
  canAdd,
  entitlementsFor,
  hiddenCount,
  limitFor,
  visibleItems,
  type ListKey,
} from "@/lib/entitlements";
import { computeCompleteness } from "@/lib/completeness";
import { normaliseMobile } from "@/lib/phone";
import { SLUG_CHANGE_DAYS, SLUG_REDIRECT_DAYS, SLUG_RESERVE_DAYS, addDays, canChangeSlug, checkSlug } from "@/lib/slug";
import { listItemSchemas, type ListName } from "@/lib/schemas";
import { urlHasBookingLanguage } from "@/lib/wording";
import { rebuildSearchIndex, recomputeQuality } from "./search";
import { getCategory, getCourt, getLocality, getCourtsByIds, listCategories, type Category, type Court, type Locality } from "./reference";
import { audit } from "./moderation";

export type PageRow = typeof pages.$inferSelect;

export class DomainError extends Error {
  constructor(
    public code: string,
    message?: string,
    public status = 400,
  ) {
    super(message ?? code);
  }
}

const live = <T extends { deletedAt: any }>(t: T) => isNull(t.deletedAt);

/* ----------------------------------------------------------- slug logic */

export type SlugState = "free" | "taken" | "reserved";

export async function slugState(slug: string, exceptPageId?: number): Promise<SlugState> {
  const db = getDb();
  const taken = await db
    .select({ id: pages.id })
    .from(pages)
    .where(and(eq(pages.slug, slug), isNull(pages.deletedAt), exceptPageId ? ne(pages.id, exceptPageId) : undefined))
    .limit(1);
  if (taken[0]) return "taken";
  const held = await db
    .select({ id: slugHistory.id })
    .from(slugHistory)
    .where(
      and(
        eq(slugHistory.oldSlug, slug),
        gt(slugHistory.validTo, new Date()),
        exceptPageId ? sql`(${slugHistory.pageId} is null or ${slugHistory.pageId} <> ${exceptPageId})` : undefined,
      ),
    )
    .limit(1);
  return held[0] ? "reserved" : "free";
}

export type SlugResolution =
  | { kind: "page"; page: PageRow }
  | { kind: "redirect"; slug: string }
  | { kind: "gone" }
  | { kind: "missing" };

/** Resolve a public slug: live page, 12-month redirect from an old slug, 410 for a reserved (deleted/recalled) slug. */
export async function resolveSlug(slug: string): Promise<SlugResolution> {
  const db = getDb();
  const rows = await db.select().from(pages).where(and(eq(pages.slug, slug), isNull(pages.deletedAt))).limit(1);
  if (rows[0]) return { kind: "page", page: rows[0] };
  const hist = await db
    .select()
    .from(slugHistory)
    .where(and(eq(slugHistory.oldSlug, slug), gt(slugHistory.validTo, new Date())))
    .orderBy(desc(slugHistory.id))
    .limit(1);
  const h = hist[0];
  if (!h) return { kind: "missing" };
  if (h.reason === "change" && h.pageId) {
    const target = await db.select({ slug: pages.slug, status: pages.status }).from(pages).where(and(eq(pages.id, h.pageId), isNull(pages.deletedAt))).limit(1);
    if (target[0]) return { kind: "redirect", slug: target[0].slug };
  }
  return { kind: "gone" };
}

/* -------------------------------------------------------------- create */

export async function accountPageCount(accountId: number): Promise<number> {
  const cutoff = addDays(new Date(), -30);
  const r = await getDb()
    .select({ n: sql<number>`count(*)::int` })
    .from(pages)
    .where(and(eq(pages.accountId, accountId), sql`(${pages.deletedAt} is null or ${pages.deletedAt} > ${cutoff})`));
  return r[0]?.n ?? 0;
}

export interface CreatePageInput {
  type: "advocate" | "firm";
  name: string;
  slug: string;
  districtId: number;
  enrolmentNo?: string;
  yearEnrolled?: number;
  establishedYear?: number;
}

export async function createPage(accountId: number, input: CreatePageInput): Promise<PageRow> {
  const db = getDb();
  if ((await accountPageCount(accountId)) >= MAX_PAGES_PER_ACCOUNT) throw new DomainError("page_limit", "An account can have 3 pages in total.", 409);
  const slugCheck = checkSlug(input.slug);
  if (!slugCheck.ok) throw new DomainError(`slug_${slugCheck.reason}`, "This page address is not allowed.");
  if ((await slugState(input.slug)) !== "free") throw new DomainError("slug_taken", "This page address is not available.", 409);
  const district = await getLocality(input.districtId);
  if (!district || district.level !== "district") throw new DomainError("district_invalid", "Choose a district from the list.");
  if (input.type === "advocate" && !(input.enrolmentNo && input.enrolmentNo.trim().length >= 3)) {
    throw new DomainError("enrolment_required", "Enrolment number is required for an advocate page.");
  }
  const acc = await db.select({ mobile: accounts.mobile }).from(accounts).where(eq(accounts.id, accountId)).limit(1);
  const page = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(pages)
      .values({
        accountId,
        type: input.type,
        slug: input.slug,
        name: input.name.trim(),
        districtId: input.districtId,
        lat: district.lat,
        lng: district.lng,
        contactMobile: acc[0]?.mobile ?? null,
        contactVerified: true, // the login number is already verified
      })
      .returning();
    if (input.type === "advocate") {
      await tx.insert(pageAdvocate).values({ pageId: row.id, enrolmentNo: input.enrolmentNo!.trim(), yearEnrolled: input.yearEnrolled ?? null });
    } else {
      await tx.insert(pageFirm).values({ pageId: row.id, establishedYear: input.establishedYear ?? null });
    }
    await tx.insert(pageCustom).values({ pageId: row.id });
    return row;
  });
  await refreshPage(page.id);
  return page;
}

/* --------------------------------------------------------------- reads */

export async function getPage(id: number): Promise<PageRow | null> {
  const r = await getDb().select().from(pages).where(and(eq(pages.id, id), isNull(pages.deletedAt))).limit(1);
  return r[0] ?? null;
}

export async function getPageBySlug(slug: string): Promise<PageRow | null> {
  const r = await getDb().select().from(pages).where(and(eq(pages.slug, slug), isNull(pages.deletedAt))).limit(1);
  return r[0] ?? null;
}

export async function getPagesByIds(ids: number[]): Promise<PageRow[]> {
  if (!ids.length) return [];
  return getDb().select().from(pages).where(and(inArray(pages.id, ids), isNull(pages.deletedAt)));
}

export async function listAccountPages(accountId: number): Promise<PageRow[]> {
  return getDb().select().from(pages).where(and(eq(pages.accountId, accountId), isNull(pages.deletedAt))).orderBy(asc(pages.id));
}

/** Owner check used by every management endpoint. */
export async function requireOwnedPage(accountId: number, pageId: number): Promise<PageRow> {
  const p = await getPage(pageId);
  if (!p || p.accountId !== accountId) throw new DomainError("not_found", "Page not found.", 404);
  return p;
}

export interface OfficeView {
  id: number;
  name: string;
  isMain: boolean;
  address: string | null;
  locality: Locality | null;
  pincode: string | null;
  phone: string | null;
  phoneVerified: boolean;
  hours: string | null;
  about: string | null;
  lat: number | null;
  lng: number | null;
  sort: number;
  courts: Court[];
}

export interface PageBundle {
  page: PageRow;
  enrolmentNo: string | null;
  yearEnrolled: number | null;
  establishedYear: number | null;
  custom: typeof pageCustom.$inferSelect | null;
  seo: typeof pageSeo.$inferSelect | null;
  district: Locality;
  courts: (Court & { itemId: number; sort: number })[];
  categories: (Category & { itemId: number; sort: number })[];
  languages: { id: number; code: string; sort: number }[];
  career: (typeof careerEntries.$inferSelect)[];
  highlights: (typeof highlights.$inferSelect)[];
  links: (typeof pageLinks.$inferSelect)[];
  cases: ((typeof caseSummaries.$inferSelect) & { court: Court | null })[];
  offices: OfficeView[];
  hidden: Record<ListKey, number>;
  activeDomain: string | null;
}

/**
 * Everything the public page or the editor shows. For the public (and Premium) view the plan limits
 * hide items beyond the first N; the owner sees everything with a hidden count (nothing is deleted).
 */
export async function loadBundle(page: PageRow, opts: { forOwner?: boolean } = {}): Promise<PageBundle> {
  const db = getDb();
  const id = page.id;
  const [adv, firm, custom, seo, courtRows, catRows, langRows, careerRows, hlRows, linkRows, caseRows, officeRows, dom] = await Promise.all([
    db.select().from(pageAdvocate).where(eq(pageAdvocate.pageId, id)).limit(1),
    db.select().from(pageFirm).where(eq(pageFirm.pageId, id)).limit(1),
    db.select().from(pageCustom).where(eq(pageCustom.pageId, id)).limit(1),
    db.select().from(pageSeo).where(eq(pageSeo.pageId, id)).limit(1),
    db.select().from(pageCourts).where(and(eq(pageCourts.pageId, id), live(pageCourts))).orderBy(asc(pageCourts.sort), asc(pageCourts.id)),
    db.select().from(pageCategories).where(and(eq(pageCategories.pageId, id), live(pageCategories))).orderBy(asc(pageCategories.sort), asc(pageCategories.id)),
    db.select().from(pageLanguages).where(and(eq(pageLanguages.pageId, id), live(pageLanguages))).orderBy(asc(pageLanguages.sort), asc(pageLanguages.id)),
    db.select().from(careerEntries).where(and(eq(careerEntries.pageId, id), live(careerEntries))).orderBy(asc(careerEntries.sort), asc(careerEntries.id)),
    db.select().from(highlights).where(and(eq(highlights.pageId, id), live(highlights))).orderBy(asc(highlights.sort), asc(highlights.id)),
    db.select().from(pageLinks).where(and(eq(pageLinks.pageId, id), live(pageLinks))).orderBy(asc(pageLinks.sort), asc(pageLinks.id)),
    db.select().from(caseSummaries).where(and(eq(caseSummaries.pageId, id), live(caseSummaries))).orderBy(desc(caseSummaries.year), asc(caseSummaries.id)),
    db.select().from(offices).where(and(eq(offices.pageId, id), live(offices))).orderBy(desc(offices.isMain), asc(offices.sort), asc(offices.id)),
    db.select({ hostname: domains.hostname }).from(domains).where(and(eq(domains.pageId, id), eq(domains.status, "active"), live(domains))).limit(1),
  ]);

  const district = (await getLocality(page.districtId))!;
  const courtIds = [...new Set([...courtRows.map((c) => c.courtId), ...caseRows.map((c) => c.courtId)])];
  const officeIds = officeRows.map((o) => o.id);
  const ocRows = officeIds.length
    ? await db.select().from(officeCourts).where(and(inArray(officeCourts.officeId, officeIds), live(officeCourts))).orderBy(asc(officeCourts.sort))
    : [];
  const allCourtIds = [...new Set([...courtIds, ...ocRows.map((o) => o.courtId)])];
  const courtMap = new Map((await getCourtsByIds(allCourtIds)).map((c) => [c.id, c]));
  const catMap = new Map((await listCategories()).map((c) => [c.id, c]));
  const localityIds = officeRows.map((o) => o.localityId).filter((x): x is number => !!x);
  const locMap = new Map<number, Locality>();
  for (const lid of localityIds) {
    const l = await getLocality(lid);
    if (l) locMap.set(lid, l);
  }

  const courtsList = courtRows
    .map((r) => (courtMap.get(r.courtId) ? { ...courtMap.get(r.courtId)!, itemId: r.id, sort: r.sort } : null))
    .filter((x): x is Court & { itemId: number; sort: number } => !!x);
  const catsList = catRows
    .map((r) => (catMap.get(r.categoryId) ? { ...catMap.get(r.categoryId)!, itemId: r.id, sort: r.sort } : null))
    .filter((x): x is Category & { itemId: number; sort: number } => !!x);
  const officesList: OfficeView[] = officeRows.map((o) => ({
    id: o.id,
    name: o.name,
    isMain: o.isMain,
    address: o.address,
    locality: o.localityId ? (locMap.get(o.localityId) ?? null) : null,
    pincode: o.pincode,
    phone: o.phone,
    phoneVerified: o.phoneVerified,
    hours: o.hours,
    about: o.about,
    lat: o.lat,
    lng: o.lng,
    sort: o.sort,
    courts: ocRows.filter((c) => c.officeId === o.id).map((c) => courtMap.get(c.courtId)).filter((c): c is Court => !!c),
  }));
  const casesList = caseRows.map((c) => ({ ...c, court: courtMap.get(c.courtId) ?? null }));

  const plan = page.plan;
  const hidden: Record<ListKey, number> = {
    courts: hiddenCount(plan, "courts", courtsList.length),
    categories: hiddenCount(plan, "categories", catsList.length),
    career: hiddenCount(plan, "career", careerRows.length),
    caseSummaries: hiddenCount(plan, "caseSummaries", casesList.length),
    offices: hiddenCount(plan, "offices", officesList.length),
    lawyers: 0,
    highlights: hiddenCount(plan, "highlights", hlRows.length),
    links: hiddenCount(plan, "links", linkRows.length),
  };
  const pub = !opts.forOwner;
  const vis = <T extends { sort: number }>(key: ListKey, items: T[]) => (pub ? visibleItems(plan, key, items) : items);
  // Case summaries are displayed by year, so apply the limit by owner order but keep year ordering
  const visibleCases = pub
    ? (() => {
        const keep = new Set(visibleItems(plan, "caseSummaries", casesList).map((c) => c.id));
        return casesList.filter((c) => keep.has(c.id));
      })()
    : casesList;

  return {
    page,
    enrolmentNo: adv[0]?.enrolmentNo ?? null,
    yearEnrolled: adv[0]?.yearEnrolled ?? null,
    establishedYear: firm[0]?.establishedYear ?? null,
    custom: custom[0] ?? null,
    seo: seo[0] ?? null,
    district,
    courts: vis("courts", courtsList),
    categories: vis("categories", catsList),
    languages: langRows.map((l) => ({ id: l.id, code: l.languageCode, sort: l.sort })),
    career: vis("career", careerRows),
    highlights: entitlementsFor(plan).highlights > 0 || !pub ? vis("highlights", hlRows) : [],
    links: entitlementsFor(plan).links > 0 || !pub ? vis("links", linkRows) : [],
    cases: visibleCases,
    offices: vis("offices", officesList),
    hidden,
    activeDomain: entitlementsFor(plan).customDomain ? (dom[0]?.hostname ?? null) : null,
  };
}

/* -------------------------------------------------------------- updates */

export interface PagePatch {
  name?: string;
  bio?: string | null;
  about?: string | null;
  districtId?: number;
  language?: "en" | "ml";
  yearEnrolled?: number | null;
  establishedYear?: number | null;
  enrolmentNo?: string;
  contactMobile?: string;
  lat?: number | null;
  lng?: number | null;
  brandColour?: string | null;
  showMemberOf?: boolean;
  allowMembers?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  photoAlt?: string | null;
  bannerAlt?: string | null;
  photoKey?: string | null;
  bannerKey?: string | null;
}

/** WCAG AA: Premium brand colour must reach 4.5:1 against white. */
export function contrastWithWhite(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return 1.05 / (L + 0.05);
}

export async function updatePage(page: PageRow, patch: PagePatch): Promise<PageRow> {
  const db = getDb();
  const ent = entitlementsFor(page.plan);
  const set: Partial<typeof pages.$inferInsert> = { updatedAt: new Date(), lastActiveAt: new Date() };
  if (patch.name !== undefined) set.name = patch.name.trim();
  if (patch.bio !== undefined) set.bio = patch.bio;
  if (patch.about !== undefined) set.about = patch.about;
  if (patch.language !== undefined) set.language = patch.language;
  if (patch.lat !== undefined) set.lat = patch.lat;
  if (patch.lng !== undefined) set.lng = patch.lng;
  if (patch.districtId !== undefined) {
    const d = await getLocality(patch.districtId);
    if (!d || d.level !== "district") throw new DomainError("district_invalid", "Choose a district from the list.");
    set.districtId = d.id;
  }
  if (patch.photoKey !== undefined) set.photoKey = patch.photoKey;
  if (patch.bannerKey !== undefined) {
    if (patch.bannerKey && !ent.banner) throw new DomainError("plan_required", "Banner images need the Professional or Premium plan.", 402);
    set.bannerKey = patch.bannerKey;
  }
  if (patch.contactMobile !== undefined) {
    const m = normaliseMobile(patch.contactMobile);
    if (!m) throw new DomainError("mobile_invalid", "Enter a valid 10-digit Indian mobile number.");
    if (m !== page.contactMobile) {
      // A different number needs OTP verification (done by the contact-number endpoint); here only the login number is accepted
      const acc = await db.select({ mobile: accounts.mobile }).from(accounts).where(eq(accounts.id, page.accountId)).limit(1);
      if (m !== acc[0]?.mobile) throw new DomainError("mobile_unverified", "A different number must be verified with an OTP first.", 409);
    }
    set.contactMobile = m;
  }
  await db.update(pages).set(set).where(eq(pages.id, page.id));

  if (page.type === "advocate" && (patch.enrolmentNo !== undefined || patch.yearEnrolled !== undefined)) {
    const s: Partial<typeof pageAdvocate.$inferInsert> = {};
    if (patch.enrolmentNo !== undefined) s.enrolmentNo = patch.enrolmentNo.trim();
    if (patch.yearEnrolled !== undefined) s.yearEnrolled = patch.yearEnrolled;
    await db.update(pageAdvocate).set(s).where(eq(pageAdvocate.pageId, page.id));
  }
  if (page.type === "firm" && patch.establishedYear !== undefined) {
    await db.update(pageFirm).set({ establishedYear: patch.establishedYear }).where(eq(pageFirm.pageId, page.id));
  }
  if (patch.brandColour !== undefined || patch.showMemberOf !== undefined || patch.allowMembers !== undefined) {
    const c: Partial<typeof pageCustom.$inferInsert> = { updatedAt: new Date() };
    if (patch.brandColour !== undefined) {
      if (patch.brandColour) {
        if (!ent.premiumLayout) throw new DomainError("plan_required", "Brand colour needs the Premium plan.", 402);
        if (contrastWithWhite(patch.brandColour) < 4.5) throw new DomainError("contrast", "This colour is too light. Choose a darker one (contrast 4.5:1 with white text).");
      }
      c.brandColour = patch.brandColour;
    }
    if (patch.showMemberOf !== undefined) {
      if (!ent.memberOfToggle && patch.showMemberOf === false) throw new DomainError("plan_required", "Hiding the Member of list needs the Premium plan.", 402);
      c.showMemberOf = patch.showMemberOf;
    }
    if (patch.allowMembers !== undefined) {
      if (!ent.approveLawyers && page.type === "firm" && patch.allowMembers === false) throw new DomainError("plan_required", "Approving lawyers needs the Professional or Premium plan.", 402);
      c.allowMembers = patch.allowMembers;
    }
    await db.insert(pageCustom).values({ pageId: page.id, ...c }).onConflictDoUpdate({ target: pageCustom.pageId, set: c });
  }
  if (["seoTitle", "seoDescription", "photoAlt", "bannerAlt"].some((k) => k in patch)) {
    const s: Partial<typeof pageSeo.$inferInsert> = { updatedAt: new Date() };
    if (patch.seoTitle !== undefined) s.title = patch.seoTitle;
    if (patch.seoDescription !== undefined) s.description = patch.seoDescription;
    if (patch.photoAlt !== undefined) s.photoAlt = patch.photoAlt;
    if (patch.bannerAlt !== undefined) s.bannerAlt = patch.bannerAlt;
    await db.insert(pageSeo).values({ pageId: page.id, ...s }).onConflictDoUpdate({ target: pageSeo.pageId, set: s });
  }
  await refreshPage(page.id);
  return (await getPage(page.id))!;
}

/* ------------------------------------------------------------ slug ops */

export async function changeSlug(page: PageRow, newSlug: string, now = new Date()): Promise<PageRow> {
  const db = getDb();
  if (newSlug === page.slug) throw new DomainError("slug_same", "This is already your page address.");
  const gate = canChangeSlug(page.slugChangedAt, now);
  if (!gate.ok) throw new DomainError("slug_cooldown", `The address can be changed once every ${SLUG_CHANGE_DAYS} days.`, 429);
  const check = checkSlug(newSlug);
  if (!check.ok) throw new DomainError(`slug_${check.reason}`, "This page address is not allowed.");
  if ((await slugState(newSlug, page.id)) !== "free") throw new DomainError("slug_taken", "This page address is not available.", 409);
  await db.transaction(async (tx) => {
    await tx.insert(slugHistory).values({
      pageId: page.id,
      oldSlug: page.slug,
      newSlug,
      validTo: addDays(now, SLUG_REDIRECT_DAYS),
      reason: "change",
    });
    await tx.update(pages).set({ slug: newSlug, slugChangedAt: now, updatedAt: now }).where(eq(pages.id, page.id));
  });
  return (await getPage(page.id))!;
}

/** Admin: take a slug away from a page (it gets a neutral address) and reserve the old one for 90 days. */
export async function recallSlug(pageId: number, adminId: number, reason: string, newSlug?: string): Promise<PageRow> {
  const db = getDb();
  const page = await getPage(pageId);
  if (!page) throw new DomainError("not_found", "Page not found.", 404);
  const replacement = newSlug ?? `page-${page.id}`;
  if ((await slugState(replacement, page.id)) !== "free") throw new DomainError("slug_taken", "Replacement address is not available.", 409);
  await db.transaction(async (tx) => {
    await tx.insert(slugHistory).values({ pageId: page.id, oldSlug: page.slug, newSlug: replacement, validTo: addDays(new Date(), SLUG_RESERVE_DAYS), reason: "recalled" });
    await tx.update(pages).set({ slug: replacement, updatedAt: new Date() }).where(eq(pages.id, page.id));
  });
  await audit({ action: "slug_recalled", resourceType: "page", resourceId: String(pageId), actorId: adminId, reason });
  return (await getPage(pageId))!;
}

/* ------------------------------------------------------------ delete etc */

/** Soft delete. The slug is reserved for 90 days; the slot frees after 30 days (see accountPageCount). */
export async function deletePage(page: PageRow, deletedBy: string): Promise<void> {
  const db = getDb();
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.insert(slugHistory).values({ pageId: page.id, oldSlug: page.slug, newSlug: null, validTo: addDays(now, SLUG_RESERVE_DAYS), reason: "deleted" });
    await tx.update(pages).set({ status: "deleted", deletedAt: now, deletedBy, slug: `~${page.id}`, updatedAt: now }).where(eq(pages.id, page.id));
    await tx.update(memberships).set({ status: "removed", updatedAt: now }).where(and(eq(memberships.advocatePageId, page.id), isNull(memberships.deletedAt)));
    await tx.update(memberships).set({ status: "removed", updatedAt: now }).where(and(eq(memberships.firmPageId, page.id), isNull(memberships.deletedAt)));
    await tx.update(posts).set({ deletedAt: now, deletedBy }).where(and(eq(posts.pageId, page.id), isNull(posts.deletedAt)));
    await tx.update(domains).set({ status: "removed", deletedAt: now, deletedBy }).where(and(eq(domains.pageId, page.id), isNull(domains.deletedAt)));
  });
  await db.delete(searchIndex).where(eq(searchIndex.pageId, page.id));
}

export async function setPlan(pageId: number, plan: string, adminId: number, reason?: string): Promise<void> {
  const db = getDb();
  const page = await getPage(pageId);
  if (!page) throw new DomainError("not_found", "Page not found.", 404);
  await db.update(pages).set({ plan, updatedAt: new Date() }).where(eq(pages.id, pageId));
  // A custom domain only serves while the page is Premium
  if (!entitlementsFor(plan).customDomain) {
    await db.update(domains).set({ status: "lapsed", updatedAt: new Date() }).where(and(eq(domains.pageId, pageId), eq(domains.status, "active")));
  }
  await audit({ action: "plan_set", resourceType: "page", resourceId: String(pageId), actorId: adminId, reason: `${page.plan} -> ${plan}${reason ? `: ${reason}` : ""}` });
  await refreshPage(pageId);
}

export async function suspendPage(pageId: number, adminId: number, reason: string, suspend = true): Promise<void> {
  await getDb()
    .update(pages)
    .set({ status: suspend ? "suspended" : "active", suspendedReason: suspend ? reason : null, updatedAt: new Date() })
    .where(eq(pages.id, pageId));
  await audit({ action: suspend ? "page_suspended" : "page_restored", resourceType: "page", resourceId: String(pageId), actorId: adminId, reason });
  await refreshPage(pageId);
}

/* ---------------------------------------------------------------- lists */

type ListConfig = {
  table: any;
  limitKey?: ListKey;
};

const LISTS: Record<ListName, ListConfig> = {
  courts: { table: pageCourts, limitKey: "courts" },
  categories: { table: pageCategories, limitKey: "categories" },
  languages: { table: pageLanguages },
  career: { table: careerEntries, limitKey: "career" },
  highlights: { table: highlights, limitKey: "highlights" },
  links: { table: pageLinks, limitKey: "links" },
  cases: { table: caseSummaries, limitKey: "caseSummaries" },
  offices: { table: offices, limitKey: "offices" },
};

export function iconKeyFor(url: string): string {
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "link";
  }
  const map: [RegExp, string][] = [
    [/(^|\.)linkedin\.com$/, "linkedin"],
    [/(^|\.)facebook\.com$|^fb\.com$/, "facebook"],
    [/(^|\.)instagram\.com$/, "instagram"],
    [/(^|\.)youtube\.com$|^youtu\.be$/, "youtube"],
    [/^x\.com$|(^|\.)twitter\.com$/, "x"],
    [/^t\.me$|(^|\.)telegram\.org$/, "telegram"],
  ];
  for (const [re, key] of map) if (re.test(host)) return key;
  return "favicon";
}

async function liveCount(table: any, pageId: number): Promise<number> {
  const r = await getDb().select({ n: sql<number>`count(*)::int` }).from(table).where(and(eq(table.pageId, pageId), isNull(table.deletedAt)));
  return r[0]?.n ?? 0;
}

async function nextSort(table: any, pageId: number): Promise<number> {
  const r = await getDb().select({ m: sql<number>`coalesce(max(${table.sort}), -1)::int` }).from(table).where(and(eq(table.pageId, pageId), isNull(table.deletedAt)));
  return (r[0]?.m ?? -1) + 1;
}

async function normaliseListInput(page: PageRow, list: ListName, raw: unknown, existingId?: number) {
  const data = (listItemSchemas[list] as any).parse(raw);
  const db = getDb();
  if (list === "courts" || list === "cases") {
    const court = await getCourt(data.courtId);
    if (!court) throw new DomainError("court_invalid", "Choose a court from the list.");
    if (list === "courts") {
      const dup = await db.select({ id: pageCourts.id }).from(pageCourts).where(and(eq(pageCourts.pageId, page.id), eq(pageCourts.courtId, data.courtId), isNull(pageCourts.deletedAt))).limit(1);
      if (dup[0]) throw new DomainError("duplicate", "This court is already on your page.", 409);
    }
  }
  if (list === "categories") {
    const cat = await getCategory(data.categoryId);
    if (!cat) throw new DomainError("category_invalid", "Choose a practice area from the list.");
    const dup = await db.select({ id: pageCategories.id }).from(pageCategories).where(and(eq(pageCategories.pageId, page.id), eq(pageCategories.categoryId, data.categoryId), isNull(pageCategories.deletedAt))).limit(1);
    if (dup[0]) throw new DomainError("duplicate", "This practice area is already on your page.", 409);
  }
  if (list === "languages") {
    const dup = await db.select({ id: pageLanguages.id }).from(pageLanguages).where(and(eq(pageLanguages.pageId, page.id), eq(pageLanguages.languageCode, data.languageCode), isNull(pageLanguages.deletedAt))).limit(1);
    if (dup[0]) throw new DomainError("duplicate", "This language is already on your page.", 409);
  }
  if (list === "links") {
    if (urlHasBookingLanguage(data.url)) throw new DomainError("link_booking", "Links with booking or discount wording are not allowed.");
    data.iconKey = iconKeyFor(data.url);
  }
  if (list === "career" && data.yearTo && data.yearTo < data.yearFrom) throw new DomainError("years_order", "The end year cannot be before the start year.");
  if (list === "highlights" && !Number.isInteger(data.number)) throw new DomainError("number_invalid", "Use a whole number up to 3 digits.");
  void existingId;
  return data;
}

/** Text fields in a list payload that need the Bar Council wording check. */
export function wordingFieldsOf(list: ListName, data: Record<string, any>): Record<string, string | null | undefined> {
  switch (list) {
    case "career": return { title: data.title, institution: data.institution, description: data.description };
    case "highlights": return { label: data.label };
    case "links": return { label: data.label };
    case "cases": return { role: data.role, note: data.note };
    case "offices": return { name: data.name, about: data.about, hours: data.hours };
    default: return {};
  }
}

export async function addListItem(page: PageRow, list: ListName, raw: unknown): Promise<{ id: number }> {
  const db = getDb();
  const cfg = LISTS[list];
  const data = await normaliseListInput(page, list, raw);
  if (cfg.limitKey) {
    const count = await liveCount(cfg.table, page.id);
    if (!canAdd(page.plan, cfg.limitKey, count)) {
      const limit = limitFor(page.plan, cfg.limitKey);
      throw new DomainError(limit === 0 ? "plan_required" : "limit_reached", limit === 0 ? "This section needs the Professional or Premium plan." : `Your plan allows ${limit} here.`, 402);
    }
  }
  const sort = await nextSort(cfg.table, page.id);
  let id: number;
  if (list === "offices") {
    const { courtIds, ...rest } = data;
    const existing = await liveCount(offices, page.id);
    const [row] = await db.insert(offices).values({ ...rest, pageId: page.id, sort, isMain: existing === 0, phone: rest.phone ? normaliseMobile(rest.phone) ?? (() => { throw new DomainError("mobile_invalid", "Enter a valid mobile number."); })() : null, phoneVerified: false }).returning({ id: offices.id });
    id = row.id;
    if (courtIds?.length) await setOfficeCourts(id, courtIds);
  } else {
    const values: any = { ...data, pageId: page.id, sort };
    if (list === "cases") values.sort = sort;
    const [row] = await db.insert(cfg.table).values(values).returning({ id: cfg.table.id });
    id = row.id;
  }
  await refreshPage(page.id);
  return { id };
}

export async function updateListItem(page: PageRow, list: ListName, itemId: number, raw: unknown): Promise<void> {
  const db = getDb();
  const cfg = LISTS[list];
  if (list === "courts" || list === "categories" || list === "languages") throw new DomainError("not_editable", "Remove and add instead.");
  const data = await normaliseListInput(page, list, raw, itemId);
  const own = await db.select({ id: cfg.table.id }).from(cfg.table).where(and(eq(cfg.table.id, itemId), eq(cfg.table.pageId, page.id), isNull(cfg.table.deletedAt))).limit(1);
  if (!own[0]) throw new DomainError("not_found", "Item not found.", 404);
  if (list === "offices") {
    const { courtIds, ...rest } = data;
    const cur = await db.select().from(offices).where(eq(offices.id, itemId)).limit(1);
    const phone = rest.phone ? (normaliseMobile(rest.phone) ?? (() => { throw new DomainError("mobile_invalid", "Enter a valid mobile number."); })()) : null;
    // Changing the number resets verification; the OTP flow sets it again
    const phoneVerified = phone !== null && phone === cur[0]?.phone ? cur[0].phoneVerified : false;
    await db.update(offices).set({ ...rest, phone, phoneVerified, updatedAt: new Date() }).where(eq(offices.id, itemId));
    if (courtIds) await setOfficeCourts(itemId, courtIds);
  } else {
    await db.update(cfg.table).set(data).where(eq(cfg.table.id, itemId));
  }
  await refreshPage(page.id);
}

export async function removeListItem(page: PageRow, list: ListName, itemId: number, deletedBy: string): Promise<void> {
  const db = getDb();
  const cfg = LISTS[list];
  const rows = await db.update(cfg.table).set({ deletedAt: new Date(), deletedBy }).where(and(eq(cfg.table.id, itemId), eq(cfg.table.pageId, page.id), isNull(cfg.table.deletedAt))).returning({ id: cfg.table.id });
  if (!rows[0]) throw new DomainError("not_found", "Item not found.", 404);
  if (list === "offices") {
    await db.update(officeCourts).set({ deletedAt: new Date(), deletedBy }).where(and(eq(officeCourts.officeId, itemId), isNull(officeCourts.deletedAt)));
    // Promote the next office to main when the main one is removed
    const rest = await db.select().from(offices).where(and(eq(offices.pageId, page.id), isNull(offices.deletedAt))).orderBy(asc(offices.sort));
    if (rest.length && !rest.some((o) => o.isMain)) await db.update(offices).set({ isMain: true }).where(eq(offices.id, rest[0].id));
  }
  await refreshPage(page.id);
}

/** Up/down arrows (and drag on desktop) swap neighbours. Case summaries are year-ordered and cannot move. */
export async function moveListItem(page: PageRow, list: ListName, itemId: number, direction: "up" | "down"): Promise<void> {
  const db = getDb();
  const cfg = LISTS[list];
  if (list === "cases") throw new DomainError("not_movable", "Case summaries are ordered by year.");
  const items = await db.select({ id: cfg.table.id, sort: cfg.table.sort }).from(cfg.table).where(and(eq(cfg.table.pageId, page.id), isNull(cfg.table.deletedAt))).orderBy(asc(cfg.table.sort), asc(cfg.table.id));
  const idx = items.findIndex((i: any) => i.id === itemId);
  if (idx < 0) throw new DomainError("not_found", "Item not found.", 404);
  const j = direction === "up" ? idx - 1 : idx + 1;
  if (j < 0 || j >= items.length) return;
  const reordered = [...items];
  [reordered[idx], reordered[j]] = [reordered[j], reordered[idx]];
  await db.transaction(async (tx) => {
    for (let k = 0; k < reordered.length; k++) await tx.update(cfg.table).set({ sort: k }).where(eq(cfg.table.id, reordered[k].id));
  });
  await refreshPage(page.id);
}

export async function setMainOffice(page: PageRow, officeId: number): Promise<void> {
  const db = getDb();
  const own = await db.select({ id: offices.id }).from(offices).where(and(eq(offices.id, officeId), eq(offices.pageId, page.id), isNull(offices.deletedAt))).limit(1);
  if (!own[0]) throw new DomainError("not_found", "Office not found.", 404);
  await db.update(offices).set({ isMain: false }).where(eq(offices.pageId, page.id));
  await db.update(offices).set({ isMain: true }).where(eq(offices.id, officeId));
  await refreshPage(page.id);
}

async function setOfficeCourts(officeId: number, courtIds: number[]): Promise<void> {
  const db = getDb();
  await db.update(officeCourts).set({ deletedAt: new Date(), deletedBy: "owner" }).where(and(eq(officeCourts.officeId, officeId), isNull(officeCourts.deletedAt)));
  const valid = await getCourtsByIds(courtIds);
  const order = new Map(courtIds.map((id, i) => [id, i]));
  if (valid.length) {
    await db.insert(officeCourts).values(valid.map((c) => ({ officeId, courtId: c.id, sort: order.get(c.id) ?? 0 })));
  }
}

/* -------------------------------------------------------------- refresh */

/** Recompute completeness and quality, then rebuild the search index rows for the page. */
export async function refreshPage(pageId: number): Promise<void> {
  const db = getDb();
  const page = await getPage(pageId);
  if (!page) return;
  const b = await loadBundle(page, { forOwner: true });
  const [postCount] = await db.select({ n: sql<number>`count(*)::int` }).from(posts).where(and(eq(posts.pageId, pageId), isNull(posts.deletedAt), eq(posts.status, "published")));
  const [lawyerCount] = page.type === "firm"
    ? await db.select({ n: sql<number>`count(*)::int` }).from(memberships).where(and(eq(memberships.firmPageId, pageId), eq(memberships.status, "active"), isNull(memberships.deletedAt)))
    : [{ n: 0 }];
  const completeness = computeCompleteness({
    type: page.type as "advocate" | "firm",
    hasPhoto: !!page.photoKey,
    hasBanner: !!page.bannerKey,
    hasBio: !!page.bio,
    hasAbout: !!page.about,
    courts: b.courts.length,
    categories: b.categories.length,
    languages: b.languages.length,
    career: b.career.length,
    offices: b.offices.length,
    hasOfficeAddress: b.offices.some((o) => !!o.address),
    caseSummaries: b.cases.length,
    posts: postCount?.n ?? 0,
    hasYear: !!(b.yearEnrolled ?? b.establishedYear),
    lawyers: lawyerCount?.n ?? 0,
    hasContact: !!page.contactMobile,
  });
  await db.update(pages).set({ completeness }).where(eq(pages.id, pageId));
  await recomputeQuality(pageId);
  await rebuildSearchIndex(pageId);
}
