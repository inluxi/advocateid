"use client";
import { useRouter } from "next/navigation";

export function PageSwitcher({ pages, current, label }: { pages: { id: number; name: string }[]; current: number; label: string }) {
  const router = useRouter();
  if (pages.length < 2) return null;
  return (
    <div className="page-switch" style={{ marginBottom: 12 }}>
      <label className="lbl" htmlFor="ps" style={{ margin: 0 }}>{label}</label>
      <select id="ps" value={current} onChange={(e) => router.push(`/manage/${e.target.value}`)}>{pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
    </div>
  );
}
