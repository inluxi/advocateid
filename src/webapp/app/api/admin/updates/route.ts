import { route, readJson } from "@/lib/api";
import { courtUpdateSchema } from "@/lib/schemas";
import { guard } from "@/lib/guards";
import { audit } from "@/repo/moderation";
import { createOfficialUpdate } from "@/repo/posts";

/** Official court update written in the back-office web form (no CSV). */
export const POST = route(async ({ req, session }) => {
  const d = await readJson(req, courtUpdateSchema);
  const post = await guard(() => createOfficialUpdate(session!.accountId, d));
  await audit({ action: "official_update_created", resourceType: "post", resourceId: String(post.id), actorId: session!.accountId });
  return { ok: true, id: post.id };
}, { auth: "admin" });
