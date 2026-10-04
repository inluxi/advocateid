import { z } from "zod";
import { route, readJson } from "@/lib/api";
import { guard, intParam, ownedPage } from "@/lib/guards";
import { confirmContact } from "@/repo/contact";

export const POST = route<{ id: string }>(async ({ req, params, session }) => {
  const page = await ownedPage(session!, intParam(params.id));
  const body = await readJson(req, z.object({ mobile: z.string().max(20), otp: z.string().regex(/^\d{6}$/) }));
  await guard(() => confirmContact(page, body.mobile, body.otp));
  return { ok: true };
}, { auth: "user", limit: ["contact_verify", 20, 900] });
