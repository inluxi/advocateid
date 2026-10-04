import { and, asc, desc, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { categories, memberships, pageCategories, pages, postCategories, posts } from "@/db/schema";
import { MAX_POST_CATEGORIES } from "@/lib/entitlements";
import { DomainError, refreshPage } from "./pages";
import { getCourt } from "./reference";

export type Post = typeof posts.$inferSelect;

export interface PostInput {
  title: string;
  body: string;
  language: "en" | "ml";
  categoryIds: number[];
  courtId: number | null;
  sourceUrl: string | null;
  coverImageKey?: string | null;
}

async function validateCategories(ids: number[]) {
  const unique = [...new Set(ids)];
  if (unique.length > MAX_POST_CATEGORIES) throw new DomainError("too_many_categories", `Choose up to ${MAX_POST_CATEGORIES} practice areas.`);
  if (!unique.length) return unique;
  const found = await getDb().select({ id: categories.id }).from(categories).where(and(inArray(categories.id, unique), isNull(categories.deletedAt)));
  if (found.length !== unique.length) throw new DomainError("category_invalid", "Choose practice areas from the list.");
  return unique;
}

async function setPostCategories(postId: number, ids: number[]) {
  const db = getDb();
  await db.delete(postCategories).where(eq(postCategories.postId, postId));
  if (ids.length) await db.insert(postCategories).values(ids.map((categoryId, i) => ({ postId, categoryId, sort: i })));
}

export async function createPost(pageId: number, type: "article" | "court_update", input: PostInput): Promise<Post> {
  const catIds = await validateCategories(input.categoryIds);
  if (input.courtId && !(await getCourt(input.courtId))) throw new DomainError("court_invalid", "Choose a court from the list.");
  if (type === "court_update") {
    if (!input.courtId) throw new DomainError("court_required", "A court is required for a court update.");
    if (!input.sourceUrl) throw new DomainError("source_required", "A source link is required for a court update.");
  }
  const [row] = await getDb()
    .insert(posts)
    .values({
      pageId,
      type,
      title: input.title,
      body: input.body,
      language: input.language,
      courtId: input.courtId,
      sourceUrl: input.sourceUrl,
      coverImageKey: input.coverImageKey ?? null,
    })
    .returning();
  await setPostCategories(row.id, catIds);
  await refreshPage(pageId); // contributions raise the author's score
  return row;
}

/** Official court update written by admin in the back office (no page, no CSV). */
export async function createOfficialUpdate(adminId: number, input: { title: string; body: string; courtId: number; sourceUrl: string; language: "en" | "ml" }): Promise<Post> {
  if (!(await getCourt(input.courtId))) throw new DomainError("court_invalid", "Choose a court from the list.");
  const [row] = await getDb().insert(posts).values({ pageId: null, type: "court_update", ...input, deletedBy: null }).returning();
  void adminId;
  return row;
}

export async function getPost(id: number): Promise<Post | null> {
  const r = await getDb().select().from(posts).where(and(eq(posts.id, id), isNull(posts.deletedAt))).limit(1);
  return r[0] ?? null;
}

export async function updatePost(post: Post, input: PostInput): Promise<void> {
  const catIds = await validateCategories(input.categoryIds);
  if (post.type === "court_update" && (!input.courtId || !input.sourceUrl)) throw new DomainError("source_required", "Court and source link are required for a court update.");
  await getDb()
    .update(posts)
    .set({ title: input.title, body: input.body, language: input.language, courtId: input.courtId, sourceUrl: input.sourceUrl, coverImageKey: input.coverImageKey ?? null, updatedAt: new Date() })
    .where(eq(posts.id, post.id));
  await setPostCategories(post.id, catIds);
  if (post.pageId) await refreshPage(post.pageId);
}

export async function deletePost(post: Post, deletedBy: string): Promise<void> {
  await getDb().update(posts).set({ deletedAt: new Date(), deletedBy }).where(eq(posts.id, post.id));
  if (post.pageId) await refreshPage(post.pageId);
}

export async function postCategoryIds(postId: number): Promise<number[]> {
  const rows = await getDb().select().from(postCategories).where(eq(postCategories.postId, postId)).orderBy(asc(postCategories.sort));
  return rows.map((r) => r.categoryId);
}

export async function categoriesOfPosts(postIds: number[]): Promise<Map<number, number[]>> {
  const map = new Map<number, number[]>();
  if (!postIds.length) return map;
  const rows = await getDb().select().from(postCategories).where(inArray(postCategories.postId, postIds)).orderBy(asc(postCategories.sort));
  for (const r of rows) map.set(r.postId, [...(map.get(r.postId) ?? []), r.categoryId]);
  return map;
}

const published = [isNull(posts.deletedAt), eq(posts.status, "published")];

export async function listPostsByPage(pageId: number, opts: { type?: "article" | "court_update"; categoryId?: number; limit?: number; offset?: number } = {}): Promise<Post[]> {
  const conds: any[] = [eq(posts.pageId, pageId), ...published];
  if (opts.type) conds.push(eq(posts.type, opts.type));
  if (opts.categoryId) conds.push(sql`exists (select 1 from post_categories pc where pc.post_id = ${posts.id} and pc.category_id = ${opts.categoryId})`);
  return getDb().select().from(posts).where(and(...conds)).orderBy(desc(posts.createdAt), desc(posts.id)).limit(opts.limit ?? 20).offset(opts.offset ?? 0);
}

/** For the owner's list: includes suspended items so they can see what happened. */
export async function listOwnPosts(pageId: number): Promise<Post[]> {
  return getDb().select().from(posts).where(and(eq(posts.pageId, pageId), isNull(posts.deletedAt))).orderBy(desc(posts.createdAt));
}

export async function countPosts(pageId: number): Promise<number> {
  const [r] = await getDb().select({ n: sql<number>`count(*)::int` }).from(posts).where(and(eq(posts.pageId, pageId), ...published));
  return r?.n ?? 0;
}

/** Similar latest posts from other authors in the same categories (global post page). */
export async function similarPosts(post: Post, categoryIds: number[], limit = 3, onlyPageIds?: number[]): Promise<Post[]> {
  if (!categoryIds.length) return [];
  const conds: any[] = [
    eq(posts.type, "article"),
    ...published,
    ne(posts.id, post.id),
    post.pageId ? ne(posts.pageId, post.pageId) : undefined,
    sql`exists (select 1 from post_categories pc where pc.post_id = ${posts.id} and pc.category_id in (${sql.join(categoryIds.map((c) => sql`${c}`), sql`, `)}))`,
    onlyPageIds ? inArray(posts.pageId, onlyPageIds) : undefined,
  ].filter(Boolean);
  return getDb().select().from(posts).where(and(...conds)).orderBy(desc(posts.createdAt)).limit(limit);
}

/** Latest posts of a page in a category plus similar latest posts from others (practice-area click). */
export async function authorCategoryPosts(authorId: number, categoryId: number) {
  const mine = await listPostsByPage(authorId, { type: "article", categoryId, limit: 10 });
  const others = await getDb()
    .select()
    .from(posts)
    .where(and(eq(posts.type, "article"), ...published, ne(posts.pageId, authorId), sql`exists (select 1 from post_categories pc where pc.post_id = ${posts.id} and pc.category_id = ${categoryId})`))
    .orderBy(desc(posts.createdAt))
    .limit(6);
  const authorOther = await getDb()
    .select()
    .from(posts)
    .where(and(eq(posts.pageId, authorId), eq(posts.type, "article"), ...published))
    .orderBy(desc(posts.createdAt))
    .limit(10);
  return { latest: mine[0] ?? null, authorPosts: mine.slice(1).concat(authorOther.filter((p) => !mine.some((m) => m.id === p.id))).slice(0, 8), others };
}

export async function listCourtUpdates(courtId: number, limit = 20, offset = 0): Promise<Post[]> {
  return getDb().select().from(posts).where(and(eq(posts.type, "court_update"), eq(posts.courtId, courtId), ...published)).orderBy(desc(posts.createdAt)).limit(limit).offset(offset);
}

export async function listCourtPosts(courtId: number, limit = 10): Promise<Post[]> {
  return getDb().select().from(posts).where(and(eq(posts.type, "article"), eq(posts.courtId, courtId), ...published)).orderBy(desc(posts.createdAt)).limit(limit);
}

export async function countCourtUpdates(courtId?: number, courtIds?: number[]): Promise<number> {
  const conds: any[] = [eq(posts.type, "court_update"), ...published];
  if (courtId) conds.push(eq(posts.courtId, courtId));
  if (courtIds) conds.push(courtIds.length ? inArray(posts.courtId, courtIds) : sql`false`);
  const [r] = await getDb().select({ n: sql<number>`count(*)::int` }).from(posts).where(and(...conds));
  return r?.n ?? 0;
}

export async function latestPosts(limit = 6): Promise<Post[]> {
  return getDb().select().from(posts).where(and(eq(posts.type, "article"), ...published)).orderBy(desc(posts.createdAt)).limit(limit);
}

export async function latestCourtUpdates(limit = 6): Promise<Post[]> {
  return getDb().select().from(posts).where(and(eq(posts.type, "court_update"), ...published)).orderBy(desc(posts.createdAt)).limit(limit);
}

/** Posts for one practice area (location/practice pages). */
export async function postsForCategory(categoryId: number, limit = 6): Promise<Post[]> {
  return getDb().select().from(posts).where(and(eq(posts.type, "article"), ...published, sql`exists (select 1 from post_categories pc where pc.post_id = ${posts.id} and pc.category_id = ${categoryId})`)).orderBy(desc(posts.createdAt)).limit(limit);
}

/** Posts of a firm's lawyers and the firm itself (premium domain scope). */
export async function colleaguePageIds(firmPageId: number): Promise<number[]> {
  const rows = await getDb().select({ id: memberships.advocatePageId }).from(memberships).where(and(eq(memberships.firmPageId, firmPageId), eq(memberships.status, "active"), isNull(memberships.deletedAt)));
  return [firmPageId, ...rows.map((r) => r.id)];
}

export async function pageHasCategory(pageId: number, categoryId: number): Promise<boolean> {
  const [r] = await getDb().select({ id: pageCategories.id }).from(pageCategories).where(and(eq(pageCategories.pageId, pageId), eq(pageCategories.categoryId, categoryId), isNull(pageCategories.deletedAt))).limit(1);
  return !!r;
}


/** Published article count per category tag for one page (compare table). */
export async function postCountsByCategory(pageId: number): Promise<Map<number, number>> {
  const rows = await getDb()
    .select({ c: postCategories.categoryId, n: sql<number>`count(*)::int` })
    .from(postCategories)
    .innerJoin(posts, eq(posts.id, postCategories.postId))
    .where(and(eq(posts.pageId, pageId), eq(posts.type, "article"), ...published))
    .groupBy(postCategories.categoryId);
  return new Map(rows.map((r) => [r.c, r.n]));
}
