"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { get, post } from "@/lib/client-api";

interface Me {
  authenticated: boolean;
  pages: { id: number; name: string; type: string }[];
}

/** "Add this court to my page": only for signed-in owners of an advocate or firm page (choose which page when there are several). */
export function AddCourtButton({ courtId, labels }: { courtId: number; labels: { add: string; choose: string; done: string; login: string; failed: string; none: string } }) {
  const [me, setMe] = useState<Me | null>(null);
  const [pageId, setPageId] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    get<Me>("/api/auth/me").then((r) => {
      if (r.ok) {
        setMe(r as unknown as Me);
        const first = (r as unknown as Me).pages?.[0];
        if (first) setPageId(first.id);
      }
    });
  }, []);
  if (me && !me.authenticated) return <Link className="btn" href="/login">{labels.login}</Link>;
  if (!me) return null;
  if (!me.pages.length) return <Link className="btn" href="/manage/new">{labels.none}</Link>;
  return (
    <div className="inline-form">
      {me.pages.length > 1 ? (
        <select aria-label={labels.choose} value={pageId ?? ""} onChange={(e) => setPageId(Number(e.target.value))}>
          {me.pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      ) : null}
      <button
        className="btn"
        type="button"
        onClick={async () => {
          if (!pageId) return;
          const r = await post(`/api/pages/${pageId}/lists/courts`, { courtId });
          setMsg(r.ok ? labels.done : (r as { message?: string }).message ?? labels.failed);
        }}
      >
        {labels.add}
      </button>
      {msg ? <span role="status">{msg}</span> : null}
    </div>
  );
}
