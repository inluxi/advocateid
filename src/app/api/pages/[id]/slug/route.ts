import { route, readJson } from "@/lib/api";
import { slugSchema } from "@/lib/schemas";
import { guard, intParam, ownedPage } from "@/lib/guards";
import { changeSlug } from "@/repo/pages";

/** One change every 90 days. The old address redirects for 12 months. */
export const POST = route<{ id: string }>(async ({ req, params, session }) => {
  const page = await ownedPage(session!, intParam(params.id));
  const { slug } = await readJson(req, slugSchema);
  const updated = await guard(() => changeSlug(page, slug));
  return { ok: true, slug: updated.slug };
}, { auth: "user" });
