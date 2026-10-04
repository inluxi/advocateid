import { ApiError, route } from "@/lib/api";
import { courtUpdateSchema, postSchema } from "@/lib/schemas";
import { guard, intParam, ownedPage, wordingGate } from "@/lib/guards";
import { createPost } from "@/repo/posts";
import { listOwnPosts } from "@/repo/posts";

export const GET = route<{ id: string }>(async ({ params, session }) => {
  const page = await ownedPage(session!, intParam(params.id));
  return { posts: await listOwnPosts(page.id) };
}, { auth: "user" });

/** type=article (default) or type=court_update. Court updates are published at once and credited to the page. */
export const POST = route<{ id: string }>(async ({ req, params, session }) => {
  const page = await ownedPage(session!, intParam(params.id));
  const type = req.nextUrl.searchParams.get("type") === "court_update" ? "court_update" : "article";
  const raw = await req.json().catch(() => null);
  if (!raw) throw new ApiError(400, "invalid_json");
  if (type === "court_update") {
    const d = courtUpdateSchema.parse(raw);
    await wordingGate(session!, { type: "post", id: page.id }, { title: d.title, body: d.body }, d.acknowledgeWording);
    const post = await guard(() => createPost(page.id, "court_update", { title: d.title, body: d.body, language: d.language, categoryIds: [], courtId: d.courtId, sourceUrl: d.sourceUrl }));
    return { ok: true, id: post.id };
  }
  const d = postSchema.parse(raw);
  await wordingGate(session!, { type: "post", id: page.id }, { title: d.title, body: d.body }, d.acknowledgeWording);
  const post = await guard(() => createPost(page.id, "article", d));
  return { ok: true, id: post.id };
}, { auth: "user", limit: ["post_create", 30, 3600] });
