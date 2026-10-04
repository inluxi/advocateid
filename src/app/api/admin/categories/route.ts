import { z } from "zod";
import { ApiError, route, readJson } from "@/lib/api";
import { audit } from "@/repo/moderation";
import { upsertCategory } from "@/repo/reference";

export const POST = route(async ({ req, session }) => {
  const b = await readJson(req, z.object({ id: z.number().int().positive().optional(), code: z.string().trim().toLowerCase(), slug: z.string().trim().toLowerCase(), name: z.string().trim().min(2).max(80), ml: z.string().trim().max(80).nullable().optional() }));
  try {
    const row = await upsertCategory(b);
    await audit({ action: "category_saved", resourceType: "category", resourceId: String(row.id), actorId: session!.accountId });
    return { ok: true, id: row.id };
  } catch (e) {
    throw new ApiError(400, "invalid", e instanceof Error ? e.message : "invalid");
  }
}, { auth: "admin" });
