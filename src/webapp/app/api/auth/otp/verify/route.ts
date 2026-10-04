import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { route, readJson, ApiError, csrfTokenFor } from "@/lib/api";
import { verifyOtpSchema } from "@/lib/schemas";
import { normaliseMobile } from "@/lib/phone";
import { hit } from "@/lib/rate-limit";
import { BOOKMARK_COOKIE, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";
import { createSession, findOrCreateAccount, loadSession, recordConsent, verifyOtp } from "@/repo/auth";
import { cancelDeletionIfPending } from "@/repo/privacy";
import { mergeBookmarks } from "@/repo/bookmarks";



export const POST = route(
  async ({ req }) => {
    const body = await readJson(req, verifyOtpSchema);
    const mobile = normaliseMobile(body.mobile);
    if (!mobile) throw new ApiError(400, "invalid_mobile", "Enter a valid 10-digit Indian mobile number.");
    const r = await hit("otp_verify_mobile", mobile, 9, 900);
    if (!r.ok) throw new ApiError(429, "rate_limited", "Too many attempts. Try again in 15 minutes.");
    const result = await verifyOtp(mobile, body.otp, "login");
    if (result === "expired") throw new ApiError(400, "otp_expired", "This OTP has expired. Request a new one.");
    if (result === "locked") throw new ApiError(429, "otp_locked", "Too many wrong attempts. Request a new OTP.");
    if (result !== "ok") throw new ApiError(400, "otp_invalid", "That OTP is not correct.");

    const account = await findOrCreateAccount(mobile);
    if (account.status !== "active") throw new ApiError(403, "account_suspended", "This account is not active.");
    if (account.isNew) await recordConsent(account.id, "mobile_login");
    const restored = await cancelDeletionIfPending(account.id);
    const { token, expiresAt } = await createSession(account.id);

    const jar = await cookies();
    const bm = jar.get(BOOKMARK_COOKIE)?.value;
    if (bm) {
      await mergeBookmarks(account.id, bm.split(".").map(Number));
      jar.delete(BOOKMARK_COOKIE);
    }
    const session = await loadSession(token);
    const res = NextResponse.json({ ok: true, isNew: account.isNew, restored, csrfToken: session ? csrfTokenFor(session) : null });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
    return res;
  },
  { limit: ["otp_verify_ip", 15, 900], noCsrf: true },
);
