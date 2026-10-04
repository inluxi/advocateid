import { z } from "zod";
import { ApiError, route, readJson } from "@/lib/api";
import { intParam, ownedPage, guard } from "@/lib/guards";
import { getMembership, moveLawyer } from "@/repo/memberships";

/** Order lawyers with arrows, at firm level or office level. */
export const POST = route<{ id: string }>(async ({ req, params, session }) => {
  const m = await getMembership(intParam(params.id));
  if (!m) throw new ApiError(404, "not_found");
  await ownedPage(session!, m.firmPageId);
  const body = await readJson(req, z.object({ direction: z.enum(["up", "down"]), scope: z.enum(["firm", "office"]).default("firm") }));
  await guard(() => moveLawyer(m.firmPageId, m.id, body.direction, body.scope));
  return { ok: true };
}, { auth: "user" });
