import { z } from "zod";
import { route, readJson } from "@/lib/api";
import { ownedPage } from "@/lib/guards";
import { setActingPage } from "@/repo/auth";

/** A login is an account, not a person: choose which page acts (posts, court additions, requests). */
export const POST = route(
  async ({ req, session }) => {
    const { pageId } = await readJson(req, z.object({ pageId: z.number().int().positive().nullable() }));
    if (pageId) await ownedPage(session!, pageId);
    await setActingPage(session!.sessionId, pageId);
    return { ok: true, actingPageId: pageId };
  },
  { auth: "user" },
);
