import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/session";
import { destroySession } from "@/repo/auth";

export const POST = route(async () => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await destroySession(token);
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}, { noCsrf: true });
