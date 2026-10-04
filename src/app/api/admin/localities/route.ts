import { z } from "zod";
import { ApiError, route, readJson } from "@/lib/api";
import { audit } from "@/repo/moderation";
import { addLocality } from "@/repo/reference";

export const POST = route(async ({ req, session }) => {
  const b = await readJson(req, z.object({ code: z.string().trim().toLowerCase(), name: z.string().trim().min(2).max(100), localName: z.string().trim().max(100).nullable().optional(), parentId: z.number().int().positive(), level: z.enum(["city", "locality"]), lat: z.number().min(6).max(38).nullable().optional(), lng: z.number().min(67).max(98).nullable().optional() }));
  try {
    const row = await addLocality(b);
    await audit({ action: "locality_added", resourceType: "locality", resourceId: String(row.id), actorId: session!.accountId });
    return { ok: true, id: row.id };
  } catch (e) {
    throw new ApiError(400, "invalid", e instanceof Error ? e.message : "invalid");
  }
}, { auth: "admin" });
