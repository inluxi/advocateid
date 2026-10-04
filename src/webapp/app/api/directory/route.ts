import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { localities, pages } from "@/db/schema";
import { route } from "@/lib/api";
import { escapeLike } from "@/lib/text";

/** Public name search over active pages (used to find a firm to join or an advocate to invite). Public data only. */
export const GET = route(async ({ req }) => {
  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") ?? "").trim().toLowerCase().slice(0, 60);
  const type = sp.get("type") === "firm" ? "firm" : "advocate";
  if (q.length < 2) return { pages: [] };
  const rows = await getDb()
    .select({ id: pages.id, name: pages.name, slug: pages.slug, type: pages.type, district: localities.name })
    .from(pages)
    .innerJoin(localities, eq(localities.id, pages.districtId))
    .where(and(eq(pages.type, type), eq(pages.status, "active"), isNull(pages.deletedAt), sql`lower(${pages.name}) like ${`%${escapeLike(q)}%`} escape '\\'`))
    .orderBy(asc(pages.name))
    .limit(8);
  return { pages: rows };
}, { limit: ["directory", 60, 60] });
