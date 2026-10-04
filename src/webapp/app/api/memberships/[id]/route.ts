import { z } from "zod";
import { ApiError, route, readJson } from "@/lib/api";
import { guard, intParam, ownedPage, wordingGate } from "@/lib/guards";
import { membershipUpdateSchema } from "@/lib/schemas";
import { decide, endMembership, getMembership, hideOnDomain, updateMembership } from "@/repo/memberships";

type P = { id: string };

async function load(id: number) {
  const m = await getMembership(id);
  if (!m) throw new ApiError(404, "not_found");
  return m;
}

/** Which side of the membership is the signed-in account (null if neither). */
async function sideOf(session: { accountId: number }, m: Awaited<ReturnType<typeof load>>) {
  const [firm, adv] = await Promise.all([ownedPage(session as any, m.firmPageId).catch(() => null), ownedPage(session as any, m.advocatePageId).catch(() => null)]);
  return { firm, adv };
}

/** PUT: the firm owner edits title, office and the 200-character intro. */
export const PUT = route<P>(async ({ req, params, session }) => {
  const m = await load(intParam(params.id));
  const { firm } = await sideOf(session!, m);
  if (!firm) throw new ApiError(403, "forbidden");
  const { acknowledgeWording, ...patch } = await readJson(req, membershipUpdateSchema);
  await wordingGate(session!, { type: "membership", id: m.id }, { title: patch.title, intro: patch.intro }, acknowledgeWording);
  await guard(() => updateMembership(m, patch));
  return { ok: true };
}, { auth: "user" });

/** POST {action}: approve | reject (decider), leave (advocate), remove (firm), hide | show (advocate: hide me on the firm's domain). */
export const POST = route<P>(async ({ req, params, session }) => {
  const m = await load(intParam(params.id));
  const { firm, adv } = await sideOf(session!, m);
  const { action } = await readJson(req, z.object({ action: z.enum(["approve", "reject", "leave", "remove", "hide", "show"]) }));
  if (action === "approve" || action === "reject") {
    const side = m.initiatedBy === "advocate" ? "firm" : "advocate";
    if ((side === "firm" && !firm) || (side === "advocate" && !adv)) throw new ApiError(403, "forbidden");
    await guard(() => decide(m, side, action === "approve"));
  } else if (action === "leave") {
    if (!adv) throw new ApiError(403, "forbidden");
    await endMembership(m, "advocate");
  } else if (action === "remove") {
    if (!firm) throw new ApiError(403, "forbidden");
    await endMembership(m, "firm");
  } else {
    if (!adv) throw new ApiError(403, "forbidden");
    await hideOnDomain(m, action === "hide");
  }
  return { ok: true };
}, { auth: "user" });
