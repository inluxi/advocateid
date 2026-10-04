import { randomUUID } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { pagePhotos } from "@/db/schema";
import { ApiError, route } from "@/lib/api";
import { entitlementsFor } from "@/lib/entitlements";
import { intParam, ownedPage } from "@/lib/guards";
import { IMAGE_LIMITS, detectImageType, getStorage, type ImageKind } from "@/lib/storage";
import { updatePage } from "@/repo/pages";

/**
 * Background upload target. The browser has already resized the picture to three sizes
 * (s=200, m=800, l=1600 px wide, WebP or JPEG), so the server never receives or keeps an original.
 * multipart fields: kind (photo|banner|office|cover), s, m, l
 */
export const POST = route<{ id: string }>(async ({ req, params, session }) => {
  const page = await ownedPage(session!, intParam(params.id));
  const form = await req.formData();
  const kind = String(form.get("kind") ?? "") as ImageKind;
  if (!(kind in IMAGE_LIMITS)) throw new ApiError(400, "invalid_kind");
  if (kind === "banner" && !entitlementsFor(page.plan).banner) throw new ApiError(402, "plan_required", "Banner images need the Professional or Premium plan.");

  const files: Record<"s" | "m" | "l", Buffer> = {} as any;
  let total = 0;
  for (const size of ["s", "m", "l"] as const) {
    const f = form.get(size);
    if (!(f instanceof Blob)) throw new ApiError(400, "missing_size", `Missing size ${size}`);
    const buf = Buffer.from(await f.arrayBuffer());
    total += buf.length;
    if (buf.length > IMAGE_LIMITS[kind]) throw new ApiError(413, "too_large", "This picture is too large.");
    if (!detectImageType(buf)) throw new ApiError(400, "not_an_image", "Only JPEG, PNG or WebP pictures are accepted.");
    files[size] = buf;
  }
  if (total > IMAGE_LIMITS[kind] * 2) throw new ApiError(413, "too_large", "This picture is too large.");

  const key = `pages/${page.id}/${kind}/${randomUUID()}`;
  const storage = await getStorage();
  for (const size of ["s", "m", "l"] as const) await storage.put(`${key}-${size}.webp`, files[size], detectImageType(files[size])!);
  await getDb().insert(pagePhotos).values({ pageId: page.id, kind, storageKey: key, sizeBytes: total });

  if (kind === "photo") await updatePage(page, { photoKey: key });
  if (kind === "banner") await updatePage(page, { bannerKey: key });

  // Remove the previous picture of the same kind (originals are never kept; old sizes are deleted too)
  const old = await getDb().select().from(pagePhotos).where(and(eq(pagePhotos.pageId, page.id), eq(pagePhotos.kind, kind), isNull(pagePhotos.deletedAt)));
  for (const o of old) {
    if (o.storageKey === key || kind === "office" || kind === "cover") continue;
    for (const size of ["s", "m", "l"]) await storage.remove(`${o.storageKey}-${size}.webp`).catch(() => undefined);
    await getDb().update(pagePhotos).set({ deletedAt: new Date(), deletedBy: "system" }).where(eq(pagePhotos.id, o.id));
  }
  return { ok: true, key };
}, { auth: "user", limit: ["image_upload", 60, 3600] });
