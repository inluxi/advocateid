import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { config } from "@/lib/config";
import { route, readJson } from "@/lib/api";
import { BOOKMARK_COOKIE } from "@/lib/session";
import { addBookmark, listBookmarkIds, removeBookmark } from "@/repo/bookmarks";

const MAX = 50;
const parse = (v: string | undefined) => (v ? v.split(".").map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, MAX) : []);

export const GET = route(async ({ session }) => {
  if (session) return { ids: await listBookmarkIds(session.accountId) };
  return { ids: parse((await cookies()).get(BOOKMARK_COOKIE)?.value) };
}, { noCsrf: true });

/** Cookie for visitors, database after login (merged at login). */
export const POST = route(async ({ req, session }) => {
  const { pageId, on } = await readJson(req, z.object({ pageId: z.number().int().positive(), on: z.boolean() }));
  if (session) {
    if (on) await addBookmark(session.accountId, pageId);
    else await removeBookmark(session.accountId, pageId);
    return { ok: true };
  }
  const jar = await cookies();
  const cur = parse(jar.get(BOOKMARK_COOKIE)?.value).filter((id) => id !== pageId);
  const next = on ? [pageId, ...cur].slice(0, MAX) : cur;
  const res = NextResponse.json({ ok: true, ids: next });
  res.cookies.set(BOOKMARK_COOKIE, next.join("."), { path: "/", sameSite: "lax", secure: config.isProd, maxAge: 365 * 86400 });
  return res;
}, { noCsrf: true });
