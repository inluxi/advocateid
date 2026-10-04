import Link from "next/link";
import { getT } from "@/lib/ctx";
import { getSavedIds } from "@/lib/request-context";
import { ClearCompare } from "@/components/ui/ClientActions";

export async function CompareTray() {
  const { t } = await getT();
  const { compare } = await getSavedIds();
  if (!compare.length) return null;
  const qs = compare.map((id, i) => `${"abc"[i]}=${id}`).join("&");
  return (
    <div className="compare-tray" role="region" aria-label={t("compare.title")}>
      <span>{t("compare.selected", { n: compare.length })}</span>
      <Link className="btn btn-sm" href={`/compare?${qs}`}>{t("compare.go")}</Link>
      <ClearCompare label={t("compare.clear")} />
    </div>
  );
}
