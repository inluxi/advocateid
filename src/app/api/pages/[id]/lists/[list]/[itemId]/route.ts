import { route } from "@/lib/api";
import { guard, intParam, ownedPage, wordingGate } from "@/lib/guards";
import { parseList } from "@/lib/list-names";
import { removeListItem, updateListItem, wordingFieldsOf } from "@/repo/pages";

type P = { id: string; list: string; itemId: string };

export const PUT = route<P>(async ({ req, params, session }) => {
  const page = await ownedPage(session!, intParam(params.id));
  const list = parseList(params.list);
  const { acknowledgeWording, ...data } = (await req.json().catch(() => ({}))) as Record<string, any>;
  await wordingGate(session!, { type: `page:${list}`, id: page.id }, wordingFieldsOf(list, data), acknowledgeWording);
  await guard(() => updateListItem(page, list, intParam(params.itemId), data));
  return { ok: true };
}, { auth: "user" });

export const DELETE = route<P>(async ({ params, session }) => {
  const page = await ownedPage(session!, intParam(params.id));
  await guard(() => removeListItem(page, parseList(params.list), intParam(params.itemId), `owner:${session!.accountId}`));
  return { ok: true };
}, { auth: "user" });
