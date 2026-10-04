import { NextResponse, type NextRequest } from "next/server";
import { devLastOtp } from "@/lib/sms";

export const dynamic = "force-dynamic";

/** End-to-end test hook: returns the last OTP the dev SMS adapter "sent". Exists only when E2E=1 and never in production. */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production" || process.env.E2E !== "1") return new NextResponse("Not found", { status: 404 });
  const mobile = req.nextUrl.searchParams.get("mobile") ?? "";
  const otp = devLastOtp(mobile);
  return otp ? NextResponse.json({ otp }) : new NextResponse("Not found", { status: 404 });
}
