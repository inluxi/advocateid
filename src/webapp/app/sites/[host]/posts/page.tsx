import type { Metadata } from "next";
import { domainMeta, requireDomainSite, trackView } from "@/lib/domain-site";
import { getT } from "@/lib/ctx";
import { ProfileShell } from "@/components/profile/ProfileShell";
import { PostsTab } from "@/components/profile/Tabs";

type Props = { params: Promise<{ host: string }>; searchParams: Promise<{ page?: string; category?: string }> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { t } = await getT();
  const sp = await searchParams;
  return domainMeta((await params).host, "posts", { title: t("profile.tab.posts"), noindex: Number(sp.page ?? 1) > 1 || !!sp.category });
}

/** On a Premium domain a practice-area click stays on the domain: own posts in that category first. */
export default async function DomainPosts({ params, searchParams }: Props) {
  const { page, ctx, data } = await requireDomainSite((await params).host);
  const sp = await searchParams;
  await trackView(page);
  return (
    <ProfileShell data={data} ctx={ctx} active="posts">
      <PostsTab data={data} ctx={ctx} pageNo={Math.max(1, Number(sp.page ?? 1) || 1)} category={sp.category} />
    </ProfileShell>
  );
}
