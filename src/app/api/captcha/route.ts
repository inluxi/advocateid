import { NextResponse } from "next/server";
import { newCaptcha } from "@/lib/captcha";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(newCaptcha(), { headers: { "cache-control": "no-store" } });
}
