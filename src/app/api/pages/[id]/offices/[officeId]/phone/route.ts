import { z } from "zod";
import { route, readJson } from "@/lib/api";
import { guard, intParam, ownedPage } from "@/lib/guards";
import { startOfficeVerification } from "@/repo/contact";

export const POST = route<{ id: string; officeId: string }>(async ({ req, params, session }) => {
  const page = await ownedPage(session!, intParam(params.id));
  const body = await readJson(req, z.object({ consent: z.boolean().default(false) }));
  await guard(() => startOfficeVerification(page, intParam(params.officeId), body.consent));
  return { ok: true };
}, { auth: "user", limit: ["office_otp", 10, 900] });
