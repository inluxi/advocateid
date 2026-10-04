import { route, readJson } from "@/lib/api";
import { updatePageSchema } from "@/lib/schemas";
import { guard, intParam, ownedPage, wordingGate } from "@/lib/guards";
import { deletePage, loadBundle, updatePage } from "@/repo/pages";
import { entitlementsFor } from "@/lib/entitlements";

type P = { id: string };

export const GET = route<P>(async ({ params, session }) => {
  const page = await ownedPage(session!, intParam(params.id));
  const b = await loadBundle(page, { forOwner: true });
  return { page: b.page, bundle: b, entitlements: { ...entitlementsFor(page.plan), lawyers: Number.isFinite(entitlementsFor(page.plan).lawyers) ? entitlementsFor(page.plan).lawyers : null } };
}, { auth: "user" });

export const PUT = route<P>(async ({ req, params, session }) => {
  const page = await ownedPage(session!, intParam(params.id));
  const { acknowledgeWording, ...patch } = await readJson(req, updatePageSchema);
  await wordingGate(session!, { type: "page", id: page.id }, { name: patch.name, bio: patch.bio, about: patch.about, seoTitle: patch.seoTitle, seoDescription: patch.seoDescription, photoAlt: patch.photoAlt, bannerAlt: patch.bannerAlt }, acknowledgeWording);
  const updated = await guard(() => updatePage(page, patch as any));
  return { ok: true, page: updated };
}, { auth: "user" });

export const DELETE = route<P>(async ({ params, session }) => {
  const page = await ownedPage(session!, intParam(params.id));
  await deletePage(page, `owner:${session!.accountId}`);
  return { ok: true };
}, { auth: "user" });
