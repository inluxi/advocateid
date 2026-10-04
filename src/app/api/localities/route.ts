import { route } from "@/lib/api";
import { getLocalityByCode, listDistrictLocalities, searchLocalities } from "@/repo/reference";

export const GET = route(async ({ req }) => {
  const sp = req.nextUrl.searchParams;
  const dcode = sp.get("d");
  if (dcode) {
    const d = await getLocalityByCode(dcode);
    if (!d) return { localities: [] };
    return { localities: (await listDistrictLocalities(d.id)).map((l) => ({ id: l.id, code: l.code, name: l.name, localName: l.localName, level: l.level })) };
  }
  const rows = await searchLocalities((sp.get("q") ?? "").trim().slice(0, 60), 20);
  return { localities: rows.map((l) => ({ id: l.id, code: l.code, name: l.name, localName: l.localName, level: l.level })) };
}, { limit: ["localities_search", 120, 60] });
