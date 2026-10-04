import { ApiError, route, readJson } from "@/lib/api";
import { verifyCaptcha } from "@/lib/captcha";
import { contactSchema } from "@/lib/schemas";
import { createContactMessage } from "@/repo/moderation";

/** Contact page, also used to request a missing court (kind = court_request). Kept 90 days. */
export const POST = route(
  async ({ req }) => {
    const b = await readJson(req, contactSchema);
    if (!verifyCaptcha(b.captchaToken, b.captchaAnswer)) throw new ApiError(400, "captcha_failed", "The check answer is not correct.");
    await createContactMessage({ kind: b.kind, name: b.name, contact: b.contact, message: b.message });
    return { ok: true };
  },
  { limit: ["contact", 5, 3600], noCsrf: true },
);
