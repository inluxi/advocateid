import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { mainProfile, mainProfileMeta, trackView } from "@/lib/profile-page";
import { seoSlug } from "@/lib/text";
import { withLang } from "@/lib/url";
import { OfficePage } from "@/components/profile/Tabs";

type Props = { params: Promise<{ slug: string; id: string; seo: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, id } = await params;
  try {
    const { data } = await mainProfile(slug, `/o/${id}/x`);
    const office = data.bundle.offices.find((o) => o.id === Number(id));
    if (!office) return { robots: { index: false } };
    // An office without its own description stays out of search results
    return mainProfileMeta(slug, "office", { path: `/o/${office.id}/${seoSlug(office.name)}`, title: office.name, description: office.about, noindex: !office.about?.trim() });
  } catch {
    return { robots: { index: false } };
  }
}

export default async function ProfileOfficePage({ params }: Props) {
  const { slug, id, seo } = await params;
  const { page, ctx, data } = await mainProfile(slug, `/o/${id}/${seo}`);
  const office = data.bundle.offices.find((o) => o.id === Number(id));
  if (!office) notFound();
  if (seo !== seoSlug(office.name)) permanentRedirect(withLang(`/${page.slug}/o/${office.id}/${seoSlug(office.name)}`, ctx.lang));
  await trackView(page);
  return <OfficePage data={data} ctx={ctx} officeId={office.id} />;
}
