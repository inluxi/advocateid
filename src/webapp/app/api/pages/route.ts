import { route, readJson } from "@/lib/api";
import { createPageSchema } from "@/lib/schemas";
import { wordingGate, guard } from "@/lib/guards";
import { createPage } from "@/repo/pages";
import { setActingPage } from "@/repo/auth";

/** Create a page with the minimum fields (advocate: name, slug, enrolment number, district). Max 3 per account. */
export const POST = route(
  async ({ req, session }) => {
    const body = await readJson(req, createPageSchema);
    await wordingGate(session!, { type: "page", id: 0 }, { name: body.name }, (body as any).acknowledgeWording);
    const page = await guard(() => createPage(session!.accountId, body));
    await setActingPage(session!.sessionId, page.id);
    return { ok: true, page: { id: page.id, slug: page.slug } };
  },
  { auth: "user", limit: ["page_create", 10, 3600] },
);
