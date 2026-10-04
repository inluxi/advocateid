import { and, eq, isNull, ne } from "drizzle-orm";
import { getDb } from "@/db/client";
import { accounts, offices, pages } from "@/db/schema";
import { normaliseMobile } from "@/lib/phone";
import { sendOtpSms } from "@/lib/sms";
import { hit } from "@/lib/rate-limit";
import { createOtp, hasConsent, recordConsent, verifyOtp } from "./auth";
import { DomainError, refreshPage, type PageRow } from "./pages";

/** One number may be used on several pages of the same account only. */
async function usedByOtherAccount(mobile: string, accountId: number): Promise<boolean> {
  const db = getDb();
  const p = await db.select({ id: pages.id }).from(pages).where(and(eq(pages.contactMobile, mobile), ne(pages.accountId, accountId), isNull(pages.deletedAt))).limit(1);
  if (p[0]) return true;
  const o = await db
    .select({ id: offices.id })
    .from(offices)
    .innerJoin(pages, eq(pages.id, offices.pageId))
    .where(and(eq(offices.phone, mobile), eq(offices.phoneVerified, true), ne(pages.accountId, accountId), isNull(offices.deletedAt)))
    .limit(1);
  if (o[0]) return true;
  const a = await db.select({ id: accounts.id }).from(accounts).where(and(eq(accounts.mobile, mobile), ne(accounts.id, accountId))).limit(1);
  return !!a[0];
}

async function requireConsent(accountId: number, consent: boolean) {
  if (!(await hasConsent(accountId, "office_phone"))) {
    if (!consent) throw new DomainError("consent_required", "Consent is required to add and show this number.");
    await recordConsent(accountId, "office_phone");
  }
}

async function sendLimited(mobile: string, otp: string) {
  const r = await hit("otp_send_mobile", mobile, 3, 900);
  if (!r.ok) throw new DomainError("rate_limited", "Too many OTP requests. Try again in 15 minutes.", 429);
  if (!(await sendOtpSms(mobile, otp))) throw new DomainError("sms_unavailable", "We could not send the OTP right now.", 503);
}

export async function startContactVerification(page: PageRow, mobileInput: string, consent: boolean): Promise<{ needsOtp: boolean }> {
  const mobile = normaliseMobile(mobileInput);
  if (!mobile) throw new DomainError("mobile_invalid", "Enter a valid 10-digit Indian mobile number.");
  const [acc] = await getDb().select({ mobile: accounts.mobile }).from(accounts).where(eq(accounts.id, page.accountId)).limit(1);
  if (mobile === acc?.mobile) {
    await getDb().update(pages).set({ contactMobile: mobile, contactVerified: true, updatedAt: new Date() }).where(eq(pages.id, page.id));
    await refreshPage(page.id);
    return { needsOtp: false };
  }
  if (await usedByOtherAccount(mobile, page.accountId)) throw new DomainError("mobile_in_use", "This number is used by another account.", 409);
  await requireConsent(page.accountId, consent);
  const otp = await createOtp(mobile, "contact", page.id);
  await sendLimited(mobile, otp);
  return { needsOtp: true };
}

export async function confirmContact(page: PageRow, mobileInput: string, otp: string): Promise<void> {
  const mobile = normaliseMobile(mobileInput);
  if (!mobile) throw new DomainError("mobile_invalid", "Enter a valid 10-digit Indian mobile number.");
  const r = await verifyOtp(mobile, otp, "contact", page.id);
  if (r !== "ok") throw new DomainError(r === "expired" ? "otp_expired" : r === "locked" ? "otp_locked" : "otp_invalid", "That OTP is not correct.", r === "locked" ? 429 : 400);
  await getDb().update(pages).set({ contactMobile: mobile, contactVerified: true, updatedAt: new Date() }).where(eq(pages.id, page.id));
  await refreshPage(page.id);
}

export async function startOfficeVerification(page: PageRow, officeId: number, consent: boolean): Promise<void> {
  const [o] = await getDb().select().from(offices).where(and(eq(offices.id, officeId), eq(offices.pageId, page.id), isNull(offices.deletedAt))).limit(1);
  if (!o) throw new DomainError("not_found", "Office not found.", 404);
  if (!o.phone) throw new DomainError("no_phone", "Add a number to this office first.");
  if (await usedByOtherAccount(o.phone, page.accountId)) throw new DomainError("mobile_in_use", "This number is used by another account.", 409);
  await requireConsent(page.accountId, consent);
  const otp = await createOtp(o.phone, "office", o.id);
  await sendLimited(o.phone, otp);
}

export async function confirmOffice(page: PageRow, officeId: number, otp: string): Promise<void> {
  const [o] = await getDb().select().from(offices).where(and(eq(offices.id, officeId), eq(offices.pageId, page.id), isNull(offices.deletedAt))).limit(1);
  if (!o?.phone) throw new DomainError("not_found", "Office not found.", 404);
  const r = await verifyOtp(o.phone, otp, "office", o.id);
  if (r !== "ok") throw new DomainError(r === "expired" ? "otp_expired" : r === "locked" ? "otp_locked" : "otp_invalid", "That OTP is not correct.", r === "locked" ? 429 : 400);
  await getDb().update(offices).set({ phoneVerified: true, updatedAt: new Date() }).where(eq(offices.id, o.id));
}
