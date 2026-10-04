import type { Metadata } from "next";
import { domainMeta, requireDomainSite, trackView } from "@/lib/domain-site";
import { getT } from "@/lib/ctx";
import { ProfileShell } from "@/components/profile/ProfileShell";
import { OfficesSection } from "@/components/profile/Sections";
import { ConnectButtons } from "@/components/profile/ConnectBar";

type Props = { params: Promise<{ host: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { t } = await getT();
  return domainMeta((await params).host, "offices", { title: t("profile.tab.contact") });
}

export default async function DomainContact({ params }: Props) {
  const { page, ctx, data } = await requireDomainSite((await params).host);
  await trackView(page);
  return (
    <ProfileShell data={data} ctx={ctx} active="overview">
      <section className="card pad">
        <h1>{ctx.t("profile.tab.contact")}</h1>
        {page.contactMobile ? <div className="row"><ConnectButtons pageId={page.id} t={ctx.t} brand /></div> : <p className="muted">{ctx.t("profile.no_contact")}</p>}
      </section>
      <OfficesSection data={data} ctx={ctx} slug={page.slug} />
    </ProfileShell>
  );
}
