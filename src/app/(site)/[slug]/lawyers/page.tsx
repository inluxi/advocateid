import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { mainProfile, mainProfileMeta, trackView } from "@/lib/profile-page";
import { getT } from "@/lib/ctx";
import { ProfileShell } from "@/components/profile/ProfileShell";
import { LawyersTab } from "@/components/profile/Tabs";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { t } = await getT();
  return mainProfileMeta((await params).slug, "lawyers", { title: t("profile.tab.lawyers") });
}

export default async function ProfileLawyersPage({ params }: Props) {
  const { page, ctx, data } = await mainProfile((await params).slug, "/lawyers");
  if (page.type !== "firm") notFound();
  await trackView(page);
  return (
    <ProfileShell data={data} ctx={ctx} active="lawyers">
      <LawyersTab data={data} ctx={ctx} />
    </ProfileShell>
  );
}
