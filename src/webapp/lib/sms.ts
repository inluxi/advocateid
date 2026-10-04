import { config } from "./config";
import { log } from "./logger";

/**
 * SMS adapter. Providers: "console" (development only) and "msg91".
 * The mobile number and the OTP are never logged in production.
 */

const g = globalThis as unknown as { __devOtps?: Map<string, string> };

/** Test/dev hook: last OTP sent to a mobile. Always empty in production. */
export function devLastOtp(mobile: string): string | undefined {
  return g.__devOtps?.get(mobile);
}

export async function sendOtpSms(mobile: string, otp: string): Promise<boolean> {
  if (config.smsProvider === "msg91") {
    const key = process.env.MSG91_AUTH_KEY;
    const template = process.env.MSG91_TEMPLATE_ID;
    if (!key || !template) {
      log.error("sms_config_missing");
      return false;
    }
    try {
      const res = await fetch("https://control.msg91.com/api/v5/flow/", {
        method: "POST",
        headers: { authkey: key, "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ template_id: template, recipients: [{ mobiles: mobile.replace(/\D/g, ""), otp }] }),
      });
      if (!res.ok) log.warn("sms_provider_rejected", { status: res.status });
      return res.ok;
    } catch (e) {
      log.error("sms_send_failed", e);
      return false;
    }
  }
  if (config.isProd) {
    log.error("sms_provider_not_configured_in_production");
    return false;
  }
  // Development: keep the OTP in memory and print it so the developer can log in.
  (g.__devOtps ??= new Map()).set(mobile, otp);
  if (process.env.NODE_ENV !== "test") console.log(`[dev-only] OTP for login: ${otp}`);
  return true;
}
