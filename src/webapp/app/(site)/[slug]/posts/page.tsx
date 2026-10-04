import type { Metadata } from "next";
import { mainProfile, mainProfileMeta, trackView } from "@/lib/profile-page";
import { getT } from "@/lib/ctx";
import { ProfileShell } from "@/components/profile/ProfileShell";
import { PostsTab } from "@/components/profile/Tabs";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { t } = await getT();
  const sp = await searchParams;
  return mainProfileMeta((await params).slug, "posts", { title: t("profile.tab.posts"), noindex: Number(sp.page ?? 1) > 1 });
}

export default async function ProfilePostsPage({ params, searchParams }: Props) {
  const { page, ctx, data } = await mainProfile((await params).slug, "/posts");
  await trackView(page);
  return (
    <ProfileShell data={data} ctx={ctx} active="posts">
      <PostsTab data={data} ctx={ctx} pageNo={Math.max(1, Number((await searchParams).page ?? 1) || 1)} />
    </ProfileShell>
  );
}
