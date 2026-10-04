import type { Metadata } from "next";
import { mainProfile, mainProfileMeta, trackView } from "@/lib/profile-page";
import { getT } from "@/lib/ctx";
import { ProfileShell } from "@/components/profile/ProfileShell";
import { OfficesTab } from "@/components/profile/Tabs";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { t } = await getT();
  return mainProfileMeta((await params).slug, "offices", { title: t("profile.tab.offices") });
}

export default async function ProfileOfficesPage({ params }: Props) {
  const { page, ctx, data } = await mainProfile((await params).slug, "/offices");
  await trackView(page);
  return (
    <ProfileShell data={data} ctx={ctx} active="offices">
      <OfficesTab data={data} ctx={ctx} />
    </ProfileShell>
  );
}
