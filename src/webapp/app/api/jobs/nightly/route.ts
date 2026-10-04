import { NextResponse, type NextRequest } from "next/server";
import { config } from "@/lib/config";
import { safeEqual } from "@/lib/crypto";
import { runNightly } from "@/jobs/nightly";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const token = config.jobToken;
  const sent = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!token || !safeEqual(sent, token)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return NextResponse.json({ ok: true, result: await runNightly() });
}
