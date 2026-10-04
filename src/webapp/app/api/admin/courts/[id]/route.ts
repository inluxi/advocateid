import { z } from "zod";
import { route, readJson, ApiError } from "@/lib/api";
import { intParam } from "@/lib/guards";
import { audit } from "@/repo/moderation";
import { getCourt, getCourtDetails, updateCourt } from "@/repo/reference";

const schema = z.object({
  name: z.string().trim().min(2).max(200).optional(),
  localName: z.string().trim().max(200).nullable().optional(),
  kind: z.string().trim().min(2).max(40).optional(),
  address: z.string().trim().max(400).nullable().optional(),
  pincode: z.string().trim().max(10).nullable().optional(),
  lat: z.number().min(6).max(38).nullable().optional(),
  lng: z.number().min(67).max(98).nullable().optional(),
  website: z.string().trim().url().nullable().optional(),
  details: z.array(z.object({ keyName: z.string().trim().min(1).max(80), value: z.string().trim().min(1).max(400) })).max(50).optional(),
});

export const GET = route<{ id: string }>(async ({ params }) => {
  const court = await getCourt(intParam(params.id));
  if (!court) throw new ApiError(404, "not_found");
  return { court, details: await getCourtDetails(court.id) };
}, { auth: "admin" });

/** Edit court fields and the key-value details table (court, order, key name, value). */
export const PUT = route<{ id: string }>(async ({ req, params, session }) => {
  const id = intParam(params.id);
  if (!(await getCourt(id))) throw new ApiError(404, "not_found");
  const { details, ...data } = await readJson(req, schema);
  await updateCourt(id, data, details);
  await audit({ action: "court_updated", resourceType: "court", resourceId: String(id), actorId: session!.accountId });
  return { ok: true };
}, { auth: "admin" });
