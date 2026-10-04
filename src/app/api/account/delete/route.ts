import { NextResponse } from "next/server";
import { z } from "zod";
import { route, readJson } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/session";
import { requestAccountDeletion } from "@/repo/privacy";

/** DPDP right to erasure: 30-day grace period (pages hidden at once), then everything is erased. */
export const POST = route(
  async ({ req, session }) => {
    await readJson(req, z.object({ confirm: z.literal(true) }));
    await requestAccountDeletion(session!.accountId);
    const res = NextResponse.json({ ok: true, graceDays: 30 });
    res.cookies.delete(SESSION_COOKIE);
    return res;
  },
  { auth: "user" },
);
