import { ApiError, route, readJson } from "@/lib/api";
import { verifyCaptcha } from "@/lib/captcha";
import { reportSchema } from "@/lib/schemas";
import { createReport } from "@/repo/moderation";

/** Anyone can report a page, post or update without logging in (captcha + rate limit). */
export const POST = route(
  async ({ req }) => {
    const b = await readJson(req, reportSchema);
    if (!verifyCaptcha(b.captchaToken, b.captchaAnswer)) throw new ApiError(400, "captcha_failed", "The check answer is not correct.");
    const id = await createReport({ targetType: b.targetType, targetId: b.targetId, reason: b.reason, details: b.details });
    if (!id) throw new ApiError(404, "not_found", "We could not find what you are reporting.");
    return { ok: true };
  },
  { limit: ["report", 5, 900], noCsrf: true },
);
