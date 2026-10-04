import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { domainMeta, requireDomainSite, trackView } from "@/lib/domain-site";
import { getT } from "@/lib/ctx";
import { ProfileShell } from "@/components/profile/ProfileShell";
import { LawyersTab } from "@/components/profile/Tabs";

type Props = { params: Promise<{ host: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { t } = await getT();
  return domainMeta((await params).host, "lawyers", { title: t("profile.tab.lawyers") });
}

export default async function DomainLawyers({ params }: Props) {
  const { page, ctx, data } = await requireDomainSite((await params).host);
  if (page.type !== "firm") notFound();
  await trackView(page);
  return (
    <ProfileShell data={data} ctx={ctx} active="lawyers">
      <LawyersTab data={data} ctx={ctx} />
    </ProfileShell>
  );
}
