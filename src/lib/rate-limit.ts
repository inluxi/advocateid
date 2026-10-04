import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { rateLimits } from "@/db/schema";
import { lookupHash } from "./crypto";

/**
 * Fixed-window rate limiter backed by the database (shared across pods).
 * Keys are one-way hashes: no raw IP or mobile is ever stored.
 */
export async function hit(bucket: string, rawKey: string, limit: number, windowSeconds: number): Promise<{ ok: boolean; count: number }> {
  const db = getDb();
  const keyHash = lookupHash(`${bucket}:${rawKey}`);
  const cutoff = new Date(Date.now() - windowSeconds * 1000);
  const rows = await db
    .insert(rateLimits)
    .values({ keyHash, bucket, count: 1, windowStart: new Date() })
    .onConflictDoUpdate({
      target: [rateLimits.keyHash, rateLimits.bucket],
      set: {
        count: sql`CASE WHEN ${rateLimits.windowStart} < ${cutoff} THEN 1 ELSE ${rateLimits.count} + 1 END`,
        windowStart: sql`CASE WHEN ${rateLimits.windowStart} < ${cutoff} THEN ${new Date()} ELSE ${rateLimits.windowStart} END`,
      },
    })
    .returning({ count: rateLimits.count });
  const count = rows[0]?.count ?? 1;
  return { ok: count <= limit, count };
}

export async function reset(bucket: string, rawKey: string): Promise<void> {
  const keyHash = lookupHash(`${bucket}:${rawKey}`);
  await getDb().delete(rateLimits).where(and(eq(rateLimits.keyHash, keyHash), eq(rateLimits.bucket, bucket)));
}

export async function purgeRateLimits(olderThanHours = 24): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanHours * 3600_000);
  const res = await getDb().delete(rateLimits).where(sql`${rateLimits.windowStart} < ${cutoff}`).returning({ k: rateLimits.keyHash });
  return res.length;
}
