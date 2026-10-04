import type { Metadata } from "next";
import { getT } from "@/lib/ctx";
import { loadOwned } from "@/lib/manage";
import { limitFor } from "@/lib/entitlements";
import { localName } from "@/lib/i18n";
import { loadBundle } from "@/repo/pages";
import { getLocality, listDistrictLocalities } from "@/repo/reference";
import { ManageNav } from "@/components/manage/ManageNav";
import { OfficeManager, type OfficeItem } from "@/components/manage/OfficeManager";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("manage.nav.offices"), robots: { index: false, follow: false } };
}

export default async function ManageOffices({ params }: { params: Promise<{ pageId: string }> }) {
  const { lang, t } = await getT();
  const { page, pages } = await loadOwned((await params).pageId, "/manage");
  const b = await loadBundle(page, { forOwner: true });
  const district = await getLocality(page.districtId);
  const locs = district ? await listDistrictLocalities(district.id) : [];
  const limit = limitFor(page.plan, "offices");
  const items: OfficeItem[] = b.offices.map((o) => ({
    id: o.id, title: o.name, subtitle: [o.address, o.locality?.name].filter(Boolean).join(", "), isMain: o.isMain, hasPhone: !!o.phone, phoneVerified: o.phoneVerified,
    raw: { name: o.name, address: o.address ?? "", localityId: o.locality?.id ?? "", pincode: o.pincode ?? "", phone: o.phone ?? "", hours: o.hours ?? "", about: o.about ?? "", lat: o.lat ?? "", lng: o.lng ?? "", courts: o.courts.map((c) => ({ id: c.id, name: c.name })) },
  }));
  return (
    <div className="app-shell">
      <ManageNav page={page} pages={pages.map((p) => ({ id: p.id, name: p.name }))} active="offices" />
      <div className="stack">
        <h1>{t("manage.nav.offices")}</h1>
        <p className="muted">{t("offices.intro")}</p>
        <div className="card pad">
          <OfficeManager pageId={page.id} items={items} limit={Number.isFinite(limit) ? limit : null} options={{ localities: locs.map((l) => ({ id: l.id, name: localName(lang, l.name, l.localName) })), districtCode: district?.code }} />
        </div>
      </div>
    </div>
  );
}
