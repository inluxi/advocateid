import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { domainMeta, loadDomainSite, requireDomainSite, trackView } from "@/lib/domain-site";
import { seoSlug } from "@/lib/text";
import { ProfileShell } from "@/components/profile/ProfileShell";
import { OfficePage } from "@/components/profile/Tabs";

type Props = { params: Promise<{ host: string; id: string; seo: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { host, id } = await params;
  const s = await loadDomainSite(host);
  const office = s?.data.bundle.offices.find((o) => o.id === Number(id));
  if (!s || !office) return { robots: { index: false } };
  return domainMeta(host, "office", { path: `/o/${office.id}/${seoSlug(office.name)}`, title: office.name, description: office.about, noindex: !office.about?.trim() });
}

export default async function DomainOffice({ params }: Props) {
  const { host, id, seo } = await params;
  const { page, ctx, data } = await requireDomainSite(host);
  const office = data.bundle.offices.find((o) => o.id === Number(id));
  if (!office) notFound();
  if (seo !== seoSlug(office.name)) permanentRedirect(`/o/${office.id}/${seoSlug(office.name)}`);
  await trackView(page);
  return (
    <ProfileShell data={data} ctx={ctx} active="offices">
      <OfficePage data={data} ctx={ctx} officeId={office.id} />
    </ProfileShell>
  );
}
