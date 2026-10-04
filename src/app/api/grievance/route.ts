import { ApiError, route, readJson } from "@/lib/api";
import { verifyCaptcha } from "@/lib/captcha";
import { grievanceSchema } from "@/lib/schemas";
import { createGrievance } from "@/repo/moderation";

export const POST = route(
  async ({ req }) => {
    const b = await readJson(req, grievanceSchema);
    if (!verifyCaptcha(b.captchaToken, b.captchaAnswer)) throw new ApiError(400, "captcha_failed", "The check answer is not correct.");
    const id = await createGrievance({ name: b.name, contact: b.contact, subject: b.subject, message: b.message });
    return { ok: true, reference: `G-${id}` };
  },
  { limit: ["grievance", 5, 3600], noCsrf: true },
);
