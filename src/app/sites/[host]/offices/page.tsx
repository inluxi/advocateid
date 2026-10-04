import type { Metadata } from "next";
import { domainMeta, requireDomainSite, trackView } from "@/lib/domain-site";
import { getT } from "@/lib/ctx";
import { ProfileShell } from "@/components/profile/ProfileShell";
import { OfficesTab } from "@/components/profile/Tabs";

type Props = { params: Promise<{ host: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { t } = await getT();
  return domainMeta((await params).host, "offices", { title: t("profile.tab.offices") });
}

export default async function DomainOffices({ params }: Props) {
  const { page, ctx, data } = await requireDomainSite((await params).host);
  await trackView(page);
  return (
    <ProfileShell data={data} ctx={ctx} active="offices">
      <OfficesTab data={data} ctx={ctx} />
    </ProfileShell>
  );
}
