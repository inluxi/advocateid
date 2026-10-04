import { z } from "zod";
import { route, readJson } from "@/lib/api";
import { intParam } from "@/lib/guards";
import { suspendPost } from "@/repo/moderation";

export const POST = route<{ id: string }>(async ({ req, params, session }) => {
  const b = await readJson(req, z.object({ suspend: z.boolean(), reason: z.string().trim().min(3).max(300) }));
  await suspendPost(intParam(params.id), session!.accountId, b.reason, b.suspend);
  return { ok: true };
}, { auth: "admin" });
