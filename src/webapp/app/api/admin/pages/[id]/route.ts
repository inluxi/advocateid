import { z } from "zod";
import { route, readJson } from "@/lib/api";
import { guard, intParam } from "@/lib/guards";
import { isPlan } from "@/lib/entitlements";
import { recallSlug, setPlan, suspendPage } from "@/repo/pages";

/** Admin actions on a page: assign plan (no payments in MVP 1), suspend/restore, recall slug. */
export const POST = route<{ id: string }>(async ({ req, params, session }) => {
  const id = intParam(params.id);
  const b = await readJson(
    req,
    z.discriminatedUnion("action", [
      z.object({ action: z.literal("plan"), plan: z.string().refine(isPlan), reason: z.string().max(300).optional() }),
      z.object({ action: z.literal("suspend"), suspend: z.boolean(), reason: z.string().trim().min(3).max(300) }),
      z.object({ action: z.literal("recall_slug"), reason: z.string().trim().min(3).max(300), newSlug: z.string().trim().toLowerCase().optional() }),
    ]),
  );
  if (b.action === "plan") await guard(() => setPlan(id, b.plan, session!.accountId, b.reason));
  else if (b.action === "suspend") await guard(() => suspendPage(id, session!.accountId, b.reason, b.suspend));
  else await guard(() => recallSlug(id, session!.accountId, b.reason, b.newSlug));
  return { ok: true };
}, { auth: "admin" });
