import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { config } from "./config";

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** Keyed one-way hash used for mobile and IP lookups (not reversible, not rainbow-able). */
export const lookupHash = (value: string) => createHmac("sha256", config.appSecret).update(value).digest("hex");

export const randomToken = (bytes = 32) => randomBytes(bytes).toString("hex");

export const randomOtp = () => String(randomInt(100000, 1000000));

export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function otpHash(otp: string, mobile: string): string {
  return createHmac("sha256", config.appSecret).update(`${mobile}:${otp}`).digest("hex");
}

/** Signed, expiring tokens (captcha, csrf). Format: base64url(payload).sig */
export function signToken(payload: Record<string, unknown>, ttlSeconds: number): string {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds })).toString("base64url");
  const sig = createHmac("sha256", config.appSecret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyToken<T extends Record<string, unknown>>(token: string): T | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", config.appSecret).update(body).digest("base64url");
  if (!safeEqual(sig, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as T & { exp: number };
    if (typeof data.exp !== "number" || data.exp < Date.now() / 1000) return null;
    return data;
  } catch {
    return null;
  }
}
