import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { exportAccountData } from "@/repo/privacy";

/** DPDP right to access: a JSON file with the account's own data. */
export const GET = route(
  async ({ session }) => {
    const data = await exportAccountData(session!.accountId);
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": 'attachment; filename="advocateid-my-data.json"',
        "cache-control": "no-store",
      },
    });
  },
  { auth: "user" },
);
