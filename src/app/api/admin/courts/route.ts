import { route } from "@/lib/api";
import { countCourts, listCourts } from "@/repo/reference";

export const GET = route(async ({ req }) => {
  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page") ?? 1) || 1);
  const size = Math.min(100, Number(sp.get("size") ?? 50) || 50);
  const [rows, total] = await Promise.all([listCourts({ q: sp.get("q") ?? undefined, limit: size, offset: (page - 1) * size }), countCourts()]);
  return { courts: rows, total, page, size };
}, { auth: "admin" });
