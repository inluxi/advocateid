import { route } from "@/lib/api";
import { guard, intParam, ownedPage } from "@/lib/guards";
import { setMainOffice } from "@/repo/pages";

export const POST = route<{ id: string; officeId: string }>(async ({ params, session }) => {
  const page = await ownedPage(session!, intParam(params.id));
  await guard(() => setMainOffice(page, intParam(params.officeId)));
  return { ok: true };
}, { auth: "user" });
