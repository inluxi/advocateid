import { cache } from "react";
import { cookies } from "next/headers";
import { config } from "./config";
import { loadSession, type SessionInfo } from "@/repo/auth";

export const SESSION_COOKIE = "aid_session";

export function sessionCookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: config.isProd,
    sameSite: "strict" as const,
    path: "/",
    expires,
  };
}

/** Current session (or null). Cached per request. */
export const getSession = cache(async (): Promise<SessionInfo | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return loadSession(token);
});

export async function requireSession(): Promise<SessionInfo> {
  const s = await getSession();
  if (!s) throw new Error("UNAUTHENTICATED");
  return s;
}

/** Essential cookies only (DPDP): session, bookmarks, compare, near-me position, rotating visitor id, language. */
export const BOOKMARK_COOKIE = "aid_bm";
export const COMPARE_COOKIE = "aid_cmp";
export const NEAR_COOKIE = "aid_near";
