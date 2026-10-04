import { z } from "zod";
import { route, readJson } from "@/lib/api";
import { guard, intParam, ownedPage } from "@/lib/guards";
import { startContactVerification } from "@/repo/contact";

/** The Connect number defaults to the login number. A different number needs an OTP (not used for login). */
export const POST = route<{ id: string }>(async ({ req, params, session }) => {
  const page = await ownedPage(session!, intParam(params.id));
  const body = await readJson(req, z.object({ mobile: z.string().max(20), consent: z.boolean().default(false) }));
  const out = await guard(() => startContactVerification(page, body.mobile, body.consent));
  return { ok: true, ...out };
}, { auth: "user", limit: ["contact_otp", 10, 900] });
