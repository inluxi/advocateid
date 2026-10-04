import { route, readJson } from "@/lib/api";
import { membershipRequestSchema } from "@/lib/schemas";
import { guard, ownedPage } from "@/lib/guards";
import { requestToJoin } from "@/repo/memberships";
import { z } from "zod";

/** An advocate page asks to join a firm (acting as that page). */
export const POST = route(async ({ req, session }) => {
  const body = await readJson(req, membershipRequestSchema.extend({ advocatePageId: z.number().int().positive() }));
  const adv = await ownedPage(session!, body.advocatePageId);
  const m = await guard(() => requestToJoin(adv, body.firmPageId, body.title, body.officeId));
  return { ok: true, id: m.id };
}, { auth: "user", limit: ["join_request", 20, 3600] });
