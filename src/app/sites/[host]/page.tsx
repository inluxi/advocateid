import type { Metadata } from "next";
import { domainMeta, requireDomainSite, trackView } from "@/lib/domain-site";
import { ProfileShell } from "@/components/profile/ProfileShell";
import { OverviewTab } from "@/components/profile/Tabs";

type Props = { params: Promise<{ host: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return domainMeta((await params).host, "overview");
}

export default async function DomainHome({ params }: Props) {
  const { page, ctx, data } = await requireDomainSite((await params).host);
  await trackView(page);
  return (
    <ProfileShell data={data} ctx={ctx} active="overview">
      <OverviewTab data={data} ctx={ctx} />
    </ProfileShell>
  );
}
