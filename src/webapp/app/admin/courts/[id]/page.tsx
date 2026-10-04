import { notFound } from "next/navigation";
import { getT } from "@/lib/ctx";
import { getCourt, getCourtDetails } from "@/repo/reference";
import { CourtEditor } from "@/components/admin/AdminForms";

export const dynamic = "force-dynamic";

export default async function AdminCourt({ params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const id = Number((await params).id);
  const court = Number.isInteger(id) ? await getCourt(id) : null;
  if (!court) notFound();
  const details = await getCourtDetails(court.id);
  return (
    <div className="stack">
      <h1>{court.name}</h1>
      <p className="muted">{t("admin.courts.edit_hint")}</p>
      <CourtEditor initial={{ id: court.id, name: court.name, localName: court.localName ?? "", kind: court.kind, address: court.address ?? "", pincode: court.pincode ?? "", lat: court.lat?.toString() ?? "", lng: court.lng?.toString() ?? "", website: court.website ?? "", details: details.map((d) => ({ keyName: d.keyName, value: d.value })) }} />
    </div>
  );
}
