import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, route, readJson } from "@/lib/api";
import { config } from "@/lib/config";
import { COMPARE_COOKIE } from "@/lib/session";

const MAX_COMPARE = 3;
const parse = (v: string | undefined) => (v ? v.split(".").map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, MAX_COMPARE) : []);

export const GET = route(async () => ({ ids: parse((await cookies()).get(COMPARE_COOKIE)?.value) }), { noCsrf: true });

/** Up to 3 advocates or firms, mixed allowed. Essential cookie, session-length. */
export const POST = route(async ({ req }) => {
  const { pageId, on } = await readJson(req, z.object({ pageId: z.number().int().positive(), on: z.boolean() }));
  const jar = await cookies();
  const cur = parse(jar.get(COMPARE_COOKIE)?.value).filter((id) => id !== pageId);
  if (on && cur.length >= MAX_COMPARE) throw new ApiError(409, "compare_full", `You can compare up to ${MAX_COMPARE} at a time.`);
  const next = on ? [...cur, pageId] : cur;
  const res = NextResponse.json({ ok: true, ids: next });
  res.cookies.set(COMPARE_COOKIE, next.join("."), { path: "/", sameSite: "lax", secure: config.isProd });
  return res;
}, { noCsrf: true });
