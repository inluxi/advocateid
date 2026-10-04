"use client";
import { useRouter } from "next/navigation";

/** Remove one item from the compare table: updates the cookie, then the shareable URL. */
export function RemoveCompare({ pageId, remaining, label }: { pageId: number; remaining: number[]; label: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="rm-col"
      onClick={async () => {
        await fetch("/api/compare", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pageId, on: false }) });
        const qs = remaining.map((id, i) => `${"abc"[i]}=${id}`).join("&");
        router.replace(`/compare${qs ? `?${qs}` : ""}`);
        router.refresh();
      }}
    >
      {label}
    </button>
  );
}
