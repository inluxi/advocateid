import { route } from "@/lib/api";
import { guard, intParam, ownedPage, wordingGate } from "@/lib/guards";
import { parseList } from "@/lib/list-names";
import { addListItem, wordingFieldsOf } from "@/repo/pages";

type P = { id: string; list: string };

/** Add an item to a list (courts, categories, languages, career, highlights, links, cases, offices). Limits come from the entitlement module. */
export const POST = route<P>(async ({ req, params, session }) => {
  const page = await ownedPage(session!, intParam(params.id));
  const list = parseList(params.list);
  const { acknowledgeWording, ...data } = (await req.json().catch(() => ({}))) as Record<string, any>;
  await wordingGate(session!, { type: `page:${list}`, id: page.id }, wordingFieldsOf(list, data), acknowledgeWording);
  const out = await guard(() => addListItem(page, list, data));
  return { ok: true, ...out };
}, { auth: "user" });
