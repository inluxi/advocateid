import { route } from "@/lib/api";
import { guard, intParam, ownedPage } from "@/lib/guards";
import { verifyDomain } from "@/repo/domains";

export const POST = route<{ id: string }>(async ({ params, session }) => {
  const page = await ownedPage(session!, intParam(params.id));
  const d = await guard(() => verifyDomain(page));
  return { ok: true, status: d.status };
}, { auth: "user", limit: ["domain_verify", 30, 3600] });
