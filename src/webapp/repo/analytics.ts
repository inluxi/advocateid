import { and, desc, eq, gte, isNull, lt, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { pageDailyEvents, pageEventsRaw, pages } from "@/db/schema";
import { log } from "@/lib/logger";

export type EventType = "impression" | "view" | "connect";

export interface EventInput {
  pageId: number;
  host: string;
  visitorId: string;
  eventType: EventType;
  context?: string | null;
  action?: "whatsapp" | "call" | null;
  isOwner: boolean;
  isBot: boolean;
}

/** Every load is recorded with owner/bot flags (nothing is excluded at recording time). */
export async function recordEvent(e: EventInput): Promise<void> {
  try {
    await getDb().insert(pageEventsRaw).values({
      pageId: e.pageId,
      host: e.host.slice(0, 253),
      visitorId: e.visitorId.slice(0, 64),
      eventType: e.eventType,
      context: e.context ?? null,
      action: e.action ?? null,
      isOwner: e.isOwner,
      isBot: e.isBot,
    });
  } catch (err) {
    log.error("event_record_failed", err); // analytics must never break a page
  }
}

export async function recordImpressions(pageIds: number[], base: Omit<EventInput, "pageId" | "eventType">): Promise<void> {
  const ids = [...new Set(pageIds)];
  if (!ids.length) return;
  try {
    await getDb().insert(pageEventsRaw).values(
      ids.map((pageId) => ({
        pageId,
        host: base.host.slice(0, 253),
        visitorId: base.visitorId.slice(0, 64),
        eventType: "impression",
        context: base.context ?? null,
        action: null,
        isOwner: base.isOwner,
        isBot: base.isBot,
      })),
    );
  } catch (err) {
    log.error("impression_record_failed", err);
  }
}

/**
 * Nightly roll-up for one UTC day. Cleaned counts (used by ranking): owner and bot loads removed,
 * one visitor counts once a day for views. Raw counts keep everything.
 */
export async function rollupDay(day: string): Promise<number> {
  const db = getDb();
  const from = new Date(`${day}T00:00:00.000Z`);
  const to = new Date(from.getTime() + 86400_000);
  const rows = await db
    .select({
      pageId: pageEventsRaw.pageId,
      host: pageEventsRaw.host,
      rawImpressions: sql<number>`count(*) filter (where ${pageEventsRaw.eventType} = 'impression')::int`,
      rawViews: sql<number>`count(*) filter (where ${pageEventsRaw.eventType} = 'view')::int`,
      rawConnects: sql<number>`count(*) filter (where ${pageEventsRaw.eventType} = 'connect')::int`,
      impressions: sql<number>`count(*) filter (where ${pageEventsRaw.eventType} = 'impression' and not ${pageEventsRaw.isOwner} and not ${pageEventsRaw.isBot})::int`,
      views: sql<number>`count(distinct ${pageEventsRaw.visitorId}) filter (where ${pageEventsRaw.eventType} = 'view' and not ${pageEventsRaw.isOwner} and not ${pageEventsRaw.isBot})::int`,
      connects: sql<number>`count(*) filter (where ${pageEventsRaw.eventType} = 'connect' and not ${pageEventsRaw.isOwner} and not ${pageEventsRaw.isBot})::int`,
    })
    .from(pageEventsRaw)
    .where(and(gte(pageEventsRaw.createdAt, from), lt(pageEventsRaw.createdAt, to)))
    .groupBy(pageEventsRaw.pageId, pageEventsRaw.host);
  for (const r of rows) {
    const values = { pageId: r.pageId, host: r.host, day, impressions: r.impressions, views: r.views, connects: r.connects, rawImpressions: r.rawImpressions, rawViews: r.rawViews, rawConnects: r.rawConnects };
    await db.insert(pageDailyEvents).values(values).onConflictDoUpdate({ target: [pageDailyEvents.pageId, pageDailyEvents.host, pageDailyEvents.day], set: values });
  }
  return rows.length;
}

/** Raw rows are kept 30 days; daily aggregates one year. */
export async function purgeRawEvents(days = 30): Promise<number> {
  const cutoff = new Date(Date.now() - days * 86400_000);
  const rows = await getDb().delete(pageEventsRaw).where(lt(pageEventsRaw.createdAt, cutoff)).returning({ id: pageEventsRaw.id });
  return rows.length;
}

export async function purgeDailyEvents(days = 365): Promise<number> {
  const cutoff = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
  const rows = await getDb().delete(pageDailyEvents).where(lt(pageDailyEvents.day, cutoff)).returning({ id: pageDailyEvents.id });
  return rows.length;
}

export interface Totals {
  host: string;
  impressions: number;
  views: number;
  connects: number;
}

/** Admin dashboard: totals per host over the last N days (aggregates only). */
export async function adminTotals(days = 30): Promise<{ byHost: Totals[]; top: { pageId: number; name: string; views: number; connects: number; impressions: number }[] }> {
  const db = getDb();
  const since = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
  const byHost = await db
    .select({
      host: pageDailyEvents.host,
      impressions: sql<number>`coalesce(sum(${pageDailyEvents.impressions}), 0)::int`,
      views: sql<number>`coalesce(sum(${pageDailyEvents.views}), 0)::int`,
      connects: sql<number>`coalesce(sum(${pageDailyEvents.connects}), 0)::int`,
    })
    .from(pageDailyEvents)
    .where(gte(pageDailyEvents.day, since))
    .groupBy(pageDailyEvents.host)
    .orderBy(desc(sql`sum(${pageDailyEvents.views})`));
  const top = await db
    .select({
      pageId: pageDailyEvents.pageId,
      name: pages.name,
      views: sql<number>`coalesce(sum(${pageDailyEvents.views}), 0)::int`,
      connects: sql<number>`coalesce(sum(${pageDailyEvents.connects}), 0)::int`,
      impressions: sql<number>`coalesce(sum(${pageDailyEvents.impressions}), 0)::int`,
    })
    .from(pageDailyEvents)
    .innerJoin(pages, eq(pages.id, pageDailyEvents.pageId))
    .where(and(gte(pageDailyEvents.day, since), isNull(pages.deletedAt)))
    .groupBy(pageDailyEvents.pageId, pages.name)
    .orderBy(desc(sql`sum(${pageDailyEvents.views})`))
    .limit(20);
  return { byHost, top };
}

export async function rawCounts(pageId: number) {
  const rows = await getDb()
    .select({ eventType: pageEventsRaw.eventType, n: sql<number>`count(*)::int` })
    .from(pageEventsRaw)
    .where(eq(pageEventsRaw.pageId, pageId))
    .groupBy(pageEventsRaw.eventType);
  return Object.fromEntries(rows.map((r) => [r.eventType, r.n]));
}

