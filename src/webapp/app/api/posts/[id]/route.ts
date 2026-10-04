import { ApiError, route } from "@/lib/api";
import { courtUpdateSchema, postSchema } from "@/lib/schemas";
import { guard, intParam, ownedPage, wordingGate } from "@/lib/guards";
import { deletePost, getPost, postCategoryIds, updatePost } from "@/repo/posts";

type P = { id: string };

async function ownedPost(session: { accountId: number }, id: number) {
  const post = await getPost(id);
  if (!post || !post.pageId) throw new ApiError(404, "not_found");
  await ownedPage(session as any, post.pageId);
  return post;
}

export const GET = route<P>(async ({ params, session }) => {
  const post = await ownedPost(session!, intParam(params.id));
  return { post, categoryIds: await postCategoryIds(post.id) };
}, { auth: "user" });

export const PUT = route<P>(async ({ req, params, session }) => {
  const post = await ownedPost(session!, intParam(params.id));
  const raw = await req.json().catch(() => null);
  if (!raw) throw new ApiError(400, "invalid_json");
  if (post.type === "court_update") {
    const d = courtUpdateSchema.parse(raw);
    await wordingGate(session!, { type: "post", id: post.id }, { title: d.title, body: d.body }, d.acknowledgeWording);
    await guard(() => updatePost(post, { title: d.title, body: d.body, language: d.language, categoryIds: [], courtId: d.courtId, sourceUrl: d.sourceUrl }));
  } else {
    const d = postSchema.parse(raw);
    await wordingGate(session!, { type: "post", id: post.id }, { title: d.title, body: d.body }, d.acknowledgeWording);
    await guard(() => updatePost(post, d));
  }
  return { ok: true };
}, { auth: "user" });

/** Soft delete (owner). */
export const DELETE = route<P>(async ({ params, session }) => {
  const post = await ownedPost(session!, intParam(params.id));
  await deletePost(post, `owner:${session!.accountId}`);
  return { ok: true };
}, { auth: "user" });
