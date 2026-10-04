import type { Metadata } from "next";
import { getT } from "@/lib/ctx";
import { loadOwned } from "@/lib/manage";
import { formatDate } from "@/lib/format";
import { listOwnPosts } from "@/repo/posts";
import { listCategories } from "@/repo/reference";
import { ManageNav } from "@/components/manage/ManageNav";
import { PostsManager } from "@/components/manage/PostsManager";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("manage.nav.posts"), robots: { index: false, follow: false } };
}

export default async function ManagePosts({ params }: { params: Promise<{ pageId: string }> }) {
  const { lang, t } = await getT();
  const { page, pages } = await loadOwned((await params).pageId, "/manage");
  const [posts, cats] = await Promise.all([listOwnPosts(page.id), listCategories()]);
  return (
    <div className="app-shell">
      <ManageNav page={page} pages={pages.map((p) => ({ id: p.id, name: p.name }))} active="posts" />
      <div className="stack">
        <h1>{t("manage.nav.posts")}</h1>
        <p className="muted">{t("posts.intro")}</p>
        <PostsManager pageId={page.id} categories={cats.map((c) => ({ id: c.id, name: c.name }))} posts={posts.map((p) => ({ id: p.id, title: p.title, type: p.type as "article" | "court_update", status: p.status, date: formatDate(p.createdAt, lang), suspendedReason: p.suspendedReason }))} />
      </div>
    </div>
  );
}
