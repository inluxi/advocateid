import { z } from "zod";
import { route, readJson } from "@/lib/api";
import { guard, intParam, ownedPage } from "@/lib/guards";
import { inviteLawyer } from "@/repo/memberships";

export const POST = route<{ id: string }>(async ({ req, params, session }) => {
  const firm = await ownedPage(session!, intParam(params.id));
  const body = await readJson(req, z.object({ advocatePageId: z.number().int().positive(), title: z.string().trim().min(2).max(80), officeId: z.number().int().positive().nullable().optional() }));
  const m = await guard(() => inviteLawyer(firm, body.advocatePageId, body.title, body.officeId ?? null));
  return { ok: true, id: m.id };
}, { auth: "user", limit: ["invite", 20, 3600] });
