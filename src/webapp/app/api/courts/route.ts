import { route } from "@/lib/api";
import { getLocalityByCode, listCourts } from "@/repo/reference";

/** Court search for the selectors (the court list is admin-seeded; users cannot add courts). */
export const GET = route(async ({ req }) => {
  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") ?? "").trim().slice(0, 60);
  const dcode = sp.get("d");
  const district = dcode ? await getLocalityByCode(dcode) : null;
  const rows = await listCourts({ q: q || undefined, districtId: district?.id, limit: 20 });
  return { courts: rows.map((c) => ({ id: c.id, code: c.code, name: c.name, localName: c.localName, kind: c.kind })) };
}, { limit: ["courts_search", 120, 60] });
