import { and, eq, inArray, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { courts, localities } from "@/db/schema";

export async function courtsOfDistrict(districtId: number): Promise<number[]> {
  const rows = await getDb().select({ id: courts.id }).from(courts).where(and(eq(courts.districtId, districtId), isNull(courts.deletedAt)));
  return rows.map((r) => r.id);
}

/** A locality and everything inside it (for location pages: city plus its areas). */
export async function localityWithChildren(id: number): Promise<number[]> {
  const db = getDb();
  const kids = await db.select({ id: localities.id }).from(localities).where(eq(localities.parentId, id));
  const ids = [id, ...kids.map((k) => k.id)];
  const grand = await db.select({ id: localities.id }).from(localities).where(inArray(localities.parentId, ids));
  return [...new Set([...ids, ...grand.map((g) => g.id)])];
}
