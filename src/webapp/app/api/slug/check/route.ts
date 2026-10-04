import { route } from "@/lib/api";
import { checkSlug } from "@/lib/slug";
import { slugState } from "@/repo/pages";

export const GET = route(async ({ req }) => {
  const slug = (req.nextUrl.searchParams.get("slug") ?? "").trim().toLowerCase();
  const except = Number(req.nextUrl.searchParams.get("except") ?? "") || undefined;
  const valid = checkSlug(slug);
  if (!valid.ok) return { available: false, reason: valid.reason };
  const state = await slugState(slug, except);
  return { available: state === "free", reason: state === "free" ? null : "taken" };
}, { limit: ["slug_check", 60, 60] });
