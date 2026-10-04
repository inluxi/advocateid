import { ApiError, route } from "@/lib/api";
import { audit } from "@/repo/moderation";
import { importCourtsCsv } from "@/repo/reference";

/** Admin: upload the all-India court CSV (text/csv body or multipart "file"). Validated first, then upserted by the id column. */
export const POST = route(async ({ req, session }) => {
  let text = "";
  const type = req.headers.get("content-type") ?? "";
  if (type.includes("multipart/form-data")) {
    const f = (await req.formData()).get("file");
    if (!(f instanceof Blob)) throw new ApiError(400, "file_required");
    text = await f.text();
  } else text = await req.text();
  if (text.length > 20 * 1024 * 1024) throw new ApiError(413, "too_large");
  const result = await importCourtsCsv(text);
  await audit({ action: "courts_imported", resourceType: "court", actorId: session!.accountId, reason: `inserted ${result.inserted}, updated ${result.updated}, errors ${result.errors.length}` });
  if (result.errors.length) throw new ApiError(422, "csv_invalid", "The file has errors. Nothing was imported.", { errors: result.errors.slice(0, 50) });
  return { ok: true, ...result };
}, { auth: "admin" });
