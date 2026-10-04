import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { auditLog, contactMessages, grievances, pages, posts, reports } from "@/db/schema";

export async function audit(e: {
  action: string;
  resourceType: string;
  resourceId?: string | null;
  actorId?: number | null;
  actorType?: "admin" | "user" | "system";
  reason?: string | null;
}): Promise<void> {
  await getDb().insert(auditLog).values({
    action: e.action,
    resourceType: e.resourceType,
    resourceId: e.resourceId ?? null,
    actorId: e.actorId ?? null,
    actorType: e.actorType ?? "admin",
    reason: e.reason ?? null,
  });
}

export async function listAudit(limit = 100) {
  return getDb().select().from(auditLog).orderBy(desc(auditLog.id)).limit(limit);
}

/** Nightly: audit entries older than a year are deleted. */
export async function purgeAudit(days = 365): Promise<number> {
  const cutoff = new Date(Date.now() - days * 86400_000);
  const rows = await getDb().delete(auditLog).where(sql`${auditLog.timestamp} < ${cutoff}`).returning({ id: auditLog.id });
  return rows.length;
}

/* ---------------------------------------------------------------- reports */

export async function createReport(r: { targetType: "page" | "post" | "update"; targetId: number; reason: string; details?: string | null }): Promise<number | null> {
  const db = getDb();
  const exists =
    r.targetType === "page"
      ? await db.select({ id: pages.id }).from(pages).where(and(eq(pages.id, r.targetId), isNull(pages.deletedAt))).limit(1)
      : await db.select({ id: posts.id }).from(posts).where(and(eq(posts.id, r.targetId), isNull(posts.deletedAt), eq(posts.type, r.targetType === "update" ? "court_update" : "article"))).limit(1);
  if (!exists[0]) return null;
  const [row] = await db.insert(reports).values({ ...r, details: r.details ?? null }).returning({ id: reports.id });
  return row.id;
}

export async function listReports(status = "open", limit = 100) {
  return getDb().select().from(reports).where(eq(reports.status, status)).orderBy(asc(reports.id)).limit(limit);
}

export async function resolveReport(id: number, status: "actioned" | "dismissed", adminId: number): Promise<void> {
  await getDb().update(reports).set({ status, resolvedAt: new Date(), resolvedBy: `admin:${adminId}` }).where(eq(reports.id, id));
  await audit({ action: `report_${status}`, resourceType: "report", resourceId: String(id), actorId: adminId });
}

export async function suspendPost(postId: number, adminId: number, reason: string, suspend = true): Promise<void> {
  await getDb()
    .update(posts)
    .set({ status: suspend ? "suspended" : "published", suspendedReason: suspend ? reason : null, updatedAt: new Date() })
    .where(eq(posts.id, postId));
  await audit({ action: suspend ? "post_suspended" : "post_restored", resourceType: "post", resourceId: String(postId), actorId: adminId, reason });
}

/* -------------------------------------------------------------- grievances */

export async function createGrievance(g: { name: string; contact: string; subject: string; message: string }): Promise<number> {
  const [row] = await getDb().insert(grievances).values(g).returning({ id: grievances.id });
  return row.id;
}

export async function listGrievances(limit = 100) {
  return getDb().select().from(grievances).orderBy(desc(grievances.id)).limit(limit);
}

export async function updateGrievance(id: number, status: "open" | "in_progress" | "resolved", adminId: number): Promise<void> {
  await getDb().update(grievances).set({ status, updatedAt: new Date() }).where(eq(grievances.id, id));
  await audit({ action: "grievance_updated", resourceType: "grievance", resourceId: String(id), actorId: adminId, reason: status });
}

/** Resolved grievances are deleted after 3 years. */
export async function purgeGrievances(years = 3): Promise<number> {
  const cutoff = new Date(Date.now() - years * 365 * 86400_000);
  const rows = await getDb().delete(grievances).where(and(eq(grievances.status, "resolved"), sql`${grievances.updatedAt} < ${cutoff}`)).returning({ id: grievances.id });
  return rows.length;
}

/* ---------------------------------------------------------------- contact */

export async function createContactMessage(m: { kind: "general" | "court_request"; name: string; contact: string; message: string }): Promise<number> {
  const [row] = await getDb().insert(contactMessages).values(m).returning({ id: contactMessages.id });
  return row.id;
}

export async function listContactMessages(limit = 100) {
  return getDb().select().from(contactMessages).orderBy(desc(contactMessages.id)).limit(limit);
}

/** Support messages are kept for 90 days. */
export async function purgeContactMessages(days = 90): Promise<number> {
  const cutoff = new Date(Date.now() - days * 86400_000);
  const rows = await getDb().delete(contactMessages).where(sql`${contactMessages.createdAt} < ${cutoff}`).returning({ id: contactMessages.id });
  return rows.length;
}
