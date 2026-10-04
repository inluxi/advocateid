import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { bookmarks, pages } from "@/db/schema";

export const MAX_BOOKMARKS = 100;

export async function listBookmarkIds(accountId: number): Promise<number[]> {
  const rows = await getDb().select({ pageId: bookmarks.pageId }).from(bookmarks).where(and(eq(bookmarks.accountId, accountId), isNull(bookmarks.deletedAt))).orderBy(desc(bookmarks.id));
  return rows.map((r) => r.pageId);
}

export async function addBookmark(accountId: number, pageId: number): Promise<void> {
  const db = getDb();
  const existing = await db.select({ id: bookmarks.id }).from(bookmarks).where(and(eq(bookmarks.accountId, accountId), eq(bookmarks.pageId, pageId), isNull(bookmarks.deletedAt))).limit(1);
  if (existing[0]) return;
  const exists = await db.select({ id: pages.id }).from(pages).where(and(eq(pages.id, pageId), isNull(pages.deletedAt))).limit(1);
  if (!exists[0]) return;
  await db.insert(bookmarks).values({ accountId, pageId });
}

export async function removeBookmark(accountId: number, pageId: number, deletedBy = "owner"): Promise<void> {
  await getDb().update(bookmarks).set({ deletedAt: new Date(), deletedBy }).where(and(eq(bookmarks.accountId, accountId), eq(bookmarks.pageId, pageId), isNull(bookmarks.deletedAt)));
}

/** Cookie bookmarks are merged into the account after login. */
export async function mergeBookmarks(accountId: number, pageIds: number[]): Promise<void> {
  const valid = pageIds.filter((n) => Number.isInteger(n) && n > 0).slice(0, MAX_BOOKMARKS);
  if (!valid.length) return;
  const found = await getDb().select({ id: pages.id }).from(pages).where(and(inArray(pages.id, valid), isNull(pages.deletedAt)));
  for (const p of found) await addBookmark(accountId, p.id);
}
