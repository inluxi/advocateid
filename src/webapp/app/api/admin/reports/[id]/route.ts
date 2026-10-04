import { z } from "zod";
import { route, readJson } from "@/lib/api";
import { intParam } from "@/lib/guards";
import { resolveReport } from "@/repo/moderation";

export const POST = route<{ id: string }>(async ({ req, params, session }) => {
  const b = await readJson(req, z.object({ status: z.enum(["actioned", "dismissed"]) }));
  await resolveReport(intParam(params.id), b.status, session!.accountId);
  return { ok: true };
}, { auth: "admin" });
