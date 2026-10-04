import { z } from "zod";
import { route, readJson } from "@/lib/api";
import { guard, intParam, ownedPage } from "@/lib/guards";
import { parseList } from "@/lib/list-names";
import { moveListItem } from "@/repo/pages";

/** Up/down arrows (drag on desktop calls this repeatedly). */
export const POST = route<{ id: string; list: string; itemId: string }>(async ({ req, params, session }) => {
  const page = await ownedPage(session!, intParam(params.id));
  const { direction } = await readJson(req, z.object({ direction: z.enum(["up", "down"]) }));
  await guard(() => moveListItem(page, parseList(params.list), intParam(params.itemId), direction));
  return { ok: true };
}, { auth: "user" });
