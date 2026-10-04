import { and, eq, inArray, isNull, lt, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  accountConsents,
  accounts,
  bookmarks,
  careerEntries,
  caseSummaries,
  domains,
  highlights,
  memberships,
  officeCourts,
  offices,
  pageAdvocate,
  pageCategories,
  pageCourts,
  pageCustom,
  pageFirm,
  pageLanguages,
  pageLinks,
  pagePhotos,
  pageScores,
  pageSeo,
  pages,
  postCategories,
  posts,
  searchIndex,
  sessions,
  slugHistory,
} from "@/db/schema";
import { addDays } from "@/lib/slug";
import { audit } from "./moderation";
import { deletePage, loadBundle, refreshPage } from "./pages";
import { destroyAllSessions } from "./auth";
import { listPostsByPage } from "./posts";

export const DELETION_GRACE_DAYS = 30;

/** DPDP: download my data. Only the account's own data is included. */
export async function exportAccountData(accountId: number) {
  const db = getDb();
  const [account] = await db.select({ id: accounts.id, mobile: accounts.mobile, status: accounts.status, createdAt: accounts.createdAt }).from(accounts).where(eq(accounts.id, accountId)).limit(1);
  const consents = await db.select().from(accountConsents).where(eq(accountConsents.accountId, accountId));
  const myPages = await db.select().from(pages).where(and(eq(pages.accountId, accountId), isNull(pages.deletedAt)));
  const pageData = [];
  for (const p of myPages) {
    const b = await loadBundle(p, { forOwner: true });
    const myPosts = await listPostsByPage(p.id, { limit: 1000 });
    pageData.push({
      page: p,
      enrolmentNo: b.enrolmentNo,
      yearEnrolled: b.yearEnrolled,
      establishedYear: b.establishedYear,
      courts: b.courts.map((c) => c.name),
      practiceAreas: b.categories.map((c) => c.name),
      languages: b.languages.map((l) => l.code),
      career: b.career,
      highlights: b.highlights,
      links: b.links,
      caseSummaries: b.cases.map(({ court, ...c }) => ({ ...c, courtName: court?.name })),
      offices: b.offices.map(({ courts, locality, ...o }) => ({ ...o, locality: locality?.name, focusCourts: courts.map((c) => c.name) })),
      posts: myPosts,
    });
  }
  const marks = await db.select().from(bookmarks).where(and(eq(bookmarks.accountId, accountId), isNull(bookmarks.deletedAt)));
  return { exportedAt: new Date().toISOString(), account, consents, pages: pageData, bookmarks: marks.map((m) => ({ pageId: m.pageId, createdAt: m.createdAt })) };
}

/** Starts the 30-day grace period: pages are hidden immediately, sessions end, and logging in again cancels it. */
export async function requestAccountDeletion(accountId: number): Promise<void> {
  const db = getDb();
  const now = new Date();
  await db.update(accounts).set({ deletionRequestedAt: now, updatedAt: now }).where(eq(accounts.id, accountId));
  const mine = await db.select({ id: pages.id }).from(pages).where(and(eq(pages.accountId, accountId), isNull(pages.deletedAt), eq(pages.status, "active")));
  if (mine.length) await db.update(pages).set({ status: "suspended", suspendedReason: "account_deletion_pending" }).where(inArray(pages.id, mine.map((p) => p.id)));
  for (const p of mine) await refreshPage(p.id);
  await destroyAllSessions(accountId);
  await audit({ action: "account_deletion_requested", resourceType: "account", resourceId: String(accountId), actorId: accountId, actorType: "user" });
}

export async function cancelDeletionIfPending(accountId: number): Promise<boolean> {
  const db = getDb();
  const [a] = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
  if (!a?.deletionRequestedAt) return false;
  await db.update(accounts).set({ deletionRequestedAt: null, updatedAt: new Date() }).where(eq(accounts.id, accountId));
  const hidden = await db.select({ id: pages.id }).from(pages).where(and(eq(pages.accountId, accountId), isNull(pages.deletedAt), eq(pages.suspendedReason, "account_deletion_pending")));
  if (hidden.length) await db.update(pages).set({ status: "active", suspendedReason: null }).where(inArray(pages.id, hidden.map((p) => p.id)));
  for (const p of hidden) await refreshPage(p.id);
  return true;
}

/** Hard-delete everything an account owns (after the grace period, or on an admin erasure order). */
export async function hardDeleteAccount(accountId: number): Promise<void> {
  const db = getDb();
  const myPages = await db.select({ id: pages.id }).from(pages).where(eq(pages.accountId, accountId));
  const pageIds = myPages.map((p) => p.id);
  if (pageIds.length) {
    const officeIds = (await db.select({ id: offices.id }).from(offices).where(inArray(offices.pageId, pageIds))).map((o) => o.id);
    const postIds = (await db.select({ id: posts.id }).from(posts).where(inArray(posts.pageId, pageIds))).map((p) => p.id);
    if (officeIds.length) await db.delete(officeCourts).where(inArray(officeCourts.officeId, officeIds));
    if (postIds.length) await db.delete(postCategories).where(inArray(postCategories.postId, postIds));
    await db.delete(posts).where(inArray(posts.pageId, pageIds));
    for (const t of [offices, careerEntries, caseSummaries, highlights, pageLinks, pageLanguages, pageCategories, pageCourts, pagePhotos, domains] as any[]) {
      await db.delete(t).where(inArray(t.pageId, pageIds));
    }
    for (const t of [pageAdvocate, pageFirm, pageCustom, pageSeo, pageScores] as any[]) await db.delete(t).where(inArray(t.pageId, pageIds));
    await db.delete(memberships).where(sql`${memberships.firmPageId} in (${sql.join(pageIds.map((i) => sql`${i}`), sql`, `)}) or ${memberships.advocatePageId} in (${sql.join(pageIds.map((i) => sql`${i}`), sql`, `)})`);
    await db.delete(searchIndex).where(inArray(searchIndex.pageId, pageIds));
    await db.delete(bookmarks).where(inArray(bookmarks.pageId, pageIds));
    await db.delete(slugHistory).where(and(inArray(slugHistory.pageId, pageIds), lt(slugHistory.validTo, new Date())));
    await db.delete(pages).where(inArray(pages.id, pageIds));
  }
  await db.delete(bookmarks).where(eq(bookmarks.accountId, accountId));
  await db.delete(sessions).where(eq(sessions.accountId, accountId));
  await db.delete(accounts).where(eq(accounts.id, accountId));
  await audit({ action: "account_hard_deleted", resourceType: "account", resourceId: String(accountId), actorType: "system" });
}

/** Nightly: accounts whose 30-day grace period is over are erased. */
export async function purgeDeletedAccounts(): Promise<number> {
  const cutoff = addDays(new Date(), -DELETION_GRACE_DAYS);
  const due = await getDb().select({ id: accounts.id }).from(accounts).where(and(lt(accounts.deletionRequestedAt, cutoff)));
  for (const a of due) {
    const mine = await getDb().select().from(pages).where(and(eq(pages.accountId, a.id), isNull(pages.deletedAt)));
    for (const p of mine) await deletePage(p, "system");
    await hardDeleteAccount(a.id);
  }
  return due.length;
}

/** Nightly: soft-deleted pages are hard-deleted 30 days later (slug reservation rows remain until they expire). */
export async function purgeSoftDeletedPages(): Promise<number> {
  const cutoff = addDays(new Date(), -DELETION_GRACE_DAYS);
  const rows = await getDb().select({ id: pages.id, accountId: pages.accountId }).from(pages).where(lt(pages.deletedAt, cutoff));
  for (const r of rows) {
    const ids = [r.id];
    const officeIds = (await getDb().select({ id: offices.id }).from(offices).where(inArray(offices.pageId, ids))).map((o) => o.id);
    const postIds = (await getDb().select({ id: posts.id }).from(posts).where(inArray(posts.pageId, ids))).map((p) => p.id);
    const db = getDb();
    if (officeIds.length) await db.delete(officeCourts).where(inArray(officeCourts.officeId, officeIds));
    if (postIds.length) await db.delete(postCategories).where(inArray(postCategories.postId, postIds));
    await db.delete(posts).where(inArray(posts.pageId, ids));
    for (const t of [offices, careerEntries, caseSummaries, highlights, pageLinks, pageLanguages, pageCategories, pageCourts, pagePhotos, domains] as any[]) await db.delete(t).where(inArray(t.pageId, ids));
    for (const t of [pageAdvocate, pageFirm, pageCustom, pageSeo, pageScores] as any[]) await db.delete(t).where(inArray(t.pageId, ids));
    await db.delete(memberships).where(sql`${memberships.firmPageId} = ${r.id} or ${memberships.advocatePageId} = ${r.id}`);
    await db.delete(bookmarks).where(eq(bookmarks.pageId, r.id));
    await db.delete(pages).where(eq(pages.id, r.id));
  }
  return rows.length;
}

