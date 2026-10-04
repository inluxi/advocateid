import { z } from "zod";
import { route, readJson } from "@/lib/api";
import { guard, intParam, ownedPage } from "@/lib/guards";
import { confirmOffice } from "@/repo/contact";

export const POST = route<{ id: string; officeId: string }>(async ({ req, params, session }) => {
  const page = await ownedPage(session!, intParam(params.id));
  const { otp } = await readJson(req, z.object({ otp: z.string().regex(/^\d{6}$/) }));
  await guard(() => confirmOffice(page, intParam(params.officeId), otp));
  return { ok: true };
}, { auth: "user", limit: ["office_verify", 20, 900] });
