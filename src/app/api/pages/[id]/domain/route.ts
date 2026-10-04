import { route, readJson } from "@/lib/api";
import { domainSchema } from "@/lib/schemas";
import { guard, intParam, ownedPage } from "@/lib/guards";
import { cnameTarget } from "@/lib/host";
import { addDomain, getDomainForPage, removeDomain } from "@/repo/domains";

export const GET = route<{ id: string }>(async ({ params, session }) => {
  const page = await ownedPage(session!, intParam(params.id));
  const d = await getDomainForPage(page.id);
  return { domain: d, cnameTarget: cnameTarget(page.slug) };
}, { auth: "user" });

export const POST = route<{ id: string }>(async ({ req, params, session }) => {
  const page = await ownedPage(session!, intParam(params.id));
  const { hostname } = await readJson(req, domainSchema);
  const d = await guard(() => addDomain(page, hostname));
  return { ok: true, domain: d, cnameTarget: cnameTarget(page.slug) };
}, { auth: "user", limit: ["domain_add", 20, 3600] });

export const DELETE = route<{ id: string }>(async ({ params, session }) => {
  const page = await ownedPage(session!, intParam(params.id));
  await removeDomain(page);
  return { ok: true };
}, { auth: "user" });
