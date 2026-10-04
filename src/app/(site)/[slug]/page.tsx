import type { Metadata } from "next";
import { mainProfile, mainProfileMeta, trackView } from "@/lib/profile-page";
import { ProfileShell } from "@/components/profile/ProfileShell";
import { OverviewTab } from "@/components/profile/Tabs";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return mainProfileMeta((await params).slug, "overview");
}

export default async function ProfilePage({ params }: Props) {
  const { page, ctx, data } = await mainProfile((await params).slug);
  await trackView(page);
  return (
    <ProfileShell data={data} ctx={ctx} active="overview">
      <OverviewTab data={data} ctx={ctx} />
    </ProfileShell>
  );
}
