import { route, readJson, ApiError } from "@/lib/api";
import { sendOtpSchema } from "@/lib/schemas";
import { normaliseMobile } from "@/lib/phone";
import { hit } from "@/lib/rate-limit";
import { createOtp } from "@/repo/auth";
import { sendOtpSms } from "@/lib/sms";

/** Never reveals whether a number already has an account. 3 requests per 15 minutes per IP and per mobile. */
export const POST = route(
  async ({ req }) => {
    const body = await readJson(req, sendOtpSchema);
    const mobile = normaliseMobile(body.mobile);
    if (!mobile) throw new ApiError(400, "invalid_mobile", "Enter a valid 10-digit Indian mobile number.");
    const perMobile = await hit("otp_send_mobile", mobile, 3, 900);
    if (!perMobile.ok) throw new ApiError(429, "rate_limited", "Too many OTP requests. Try again in 15 minutes.");
    const otp = await createOtp(mobile, "login");
    const sent = await sendOtpSms(mobile, otp);
    if (!sent) throw new ApiError(503, "sms_unavailable", "We could not send the OTP right now. Please try again shortly.");
    return { ok: true, expiresInMinutes: 10 };
  },
  { limit: ["otp_send_ip", 3, 900], noCsrf: true },
);
