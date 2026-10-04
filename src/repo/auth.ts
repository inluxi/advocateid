import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { accountConsents, accounts, otpLogs, sessions } from "@/db/schema";
import { config } from "@/lib/config";
import { lookupHash, otpHash, randomOtp, randomToken, safeEqual, sha256 } from "@/lib/crypto";
import { addDays } from "@/lib/slug";

export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 3;
export const SESSION_DAYS = 30;

export type OtpPurpose = "login" | "contact" | "office";

/** Creates an OTP row (hash only) and returns the plaintext once, for the SMS adapter. */
export async function createOtp(mobile: string, purpose: OtpPurpose = "login", subjectId?: number): Promise<string> {
  const db = getDb();
  const mobileHash = lookupHash(mobile);
  // Invalidate earlier unconsumed OTPs for the same mobile and purpose
  await db
    .update(otpLogs)
    .set({ consumedAt: new Date() })
    .where(and(eq(otpLogs.mobileHash, mobileHash), eq(otpLogs.purpose, purpose), isNull(otpLogs.consumedAt)));
  const otp = randomOtp();
  await db.insert(otpLogs).values({
    mobileHash,
    otpHash: otpHash(otp, mobile),
    purpose,
    subjectId: subjectId ?? null,
    expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000),
  });
  return otp;
}

export type OtpResult = "ok" | "invalid" | "expired" | "locked";

export async function verifyOtp(mobile: string, otp: string, purpose: OtpPurpose = "login", subjectId?: number): Promise<OtpResult> {
  const db = getDb();
  const mobileHash = lookupHash(mobile);
  const rows = await db
    .select()
    .from(otpLogs)
    .where(and(eq(otpLogs.mobileHash, mobileHash), eq(otpLogs.purpose, purpose), isNull(otpLogs.consumedAt), isNull(otpLogs.deletedAt)))
    .orderBy(desc(otpLogs.id))
    .limit(1);
  const row = rows[0];
  if (!row) return "invalid";
  if (subjectId !== undefined && row.subjectId !== subjectId) return "invalid";
  if (row.expiresAt < new Date()) return "expired";
  if (row.attempts >= OTP_MAX_ATTEMPTS) return "locked";
  if (!safeEqual(row.otpHash, otpHash(otp, mobile))) {
    await db.update(otpLogs).set({ attempts: sql`${otpLogs.attempts} + 1` }).where(eq(otpLogs.id, row.id));
    return row.attempts + 1 >= OTP_MAX_ATTEMPTS ? "locked" : "invalid";
  }
  await db.update(otpLogs).set({ consumedAt: new Date() }).where(eq(otpLogs.id, row.id));
  return "ok";
}

/** One mobile login = one account. Creates it on first successful OTP. */
export async function findOrCreateAccount(mobile: string): Promise<{ id: number; isNew: boolean; role: string; status: string }> {
  const db = getDb();
  const existing = await db.select().from(accounts).where(eq(accounts.mobile, mobile)).limit(1);
  if (existing[0]) {
    const a = existing[0];
    return { id: a.id, isNew: false, role: a.role, status: a.status };
  }
  const role = config.adminMobiles.includes(mobile) ? "admin" : "user";
  const inserted = await db.insert(accounts).values({ mobile, role }).returning({ id: accounts.id });
  return { id: inserted[0].id, isNew: true, role, status: "active" };
}

export async function recordConsent(accountId: number, type: string, noticeVersion = "1"): Promise<void> {
  await getDb().insert(accountConsents).values({ accountId, type, noticeVersion });
}

export async function withdrawConsent(accountId: number, type: string): Promise<void> {
  await getDb()
    .update(accountConsents)
    .set({ withdrawnAt: new Date() })
    .where(and(eq(accountConsents.accountId, accountId), eq(accountConsents.type, type), isNull(accountConsents.withdrawnAt)));
}

export async function hasConsent(accountId: number, type: string): Promise<boolean> {
  const rows = await getDb()
    .select({ id: accountConsents.id })
    .from(accountConsents)
    .where(and(eq(accountConsents.accountId, accountId), eq(accountConsents.type, type), isNull(accountConsents.withdrawnAt)))
    .limit(1);
  return rows.length > 0;
}

/* ------------------------------------------------------------- sessions */

export async function createSession(accountId: number): Promise<{ token: string; expiresAt: Date }> {
  const token = randomToken(32);
  const expiresAt = addDays(new Date(), SESSION_DAYS);
  await getDb().insert(sessions).values({ accountId, tokenHash: sha256(token), expiresAt });
  return { token, expiresAt };
}

export interface SessionInfo {
  sessionId: number;
  accountId: number;
  mobile: string;
  role: string;
  actingPageId: number | null;
  tokenHash: string;
}

export async function loadSession(token: string): Promise<SessionInfo | null> {
  const tokenHash = sha256(token);
  const rows = await getDb()
    .select({
      sessionId: sessions.id,
      accountId: sessions.accountId,
      mobile: accounts.mobile,
      role: accounts.role,
      status: accounts.status,
      actingPageId: sessions.actingPageId,
    })
    .from(sessions)
    .innerJoin(accounts, eq(accounts.id, sessions.accountId))
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date()), isNull(accounts.deletedAt)))
    .limit(1);
  const r = rows[0];
  if (!r || r.status !== "active") return null;
  return { sessionId: r.sessionId, accountId: r.accountId, mobile: r.mobile, role: r.role, actingPageId: r.actingPageId, tokenHash };
}

export async function destroySession(token: string): Promise<void> {
  await getDb().delete(sessions).where(eq(sessions.tokenHash, sha256(token)));
}

export async function destroyAllSessions(accountId: number): Promise<void> {
  await getDb().delete(sessions).where(eq(sessions.accountId, accountId));
}

export async function setActingPage(sessionId: number, pageId: number | null): Promise<void> {
  await getDb().update(sessions).set({ actingPageId: pageId }).where(eq(sessions.id, sessionId));
}

/** Nightly: OTP logs older than 7 days are deleted (DPDP retention). */
export async function purgeOtpLogs(days = 7): Promise<number> {
  const cutoff = new Date(Date.now() - days * 86400_000);
  const rows = await getDb().delete(otpLogs).where(sql`${otpLogs.createdAt} < ${cutoff}`).returning({ id: otpLogs.id });
  return rows.length;
}

export async function purgeExpiredSessions(): Promise<number> {
  const rows = await getDb().delete(sessions).where(sql`${sessions.expiresAt} < now()`).returning({ id: sessions.id });
  return rows.length;
}
