import { z } from "zod";
import { route, readJson } from "@/lib/api";
import { intParam } from "@/lib/guards";
import { updateGrievance } from "@/repo/moderation";

export const POST = route<{ id: string }>(async ({ req, params, session }) => {
  const b = await readJson(req, z.object({ status: z.enum(["open", "in_progress", "resolved"]) }));
  await updateGrievance(intParam(params.id), b.status, session!.accountId);
  return { ok: true };
}, { auth: "admin" });
