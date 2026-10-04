"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return res.ok ? res.json() : null;
}

/** Compare tick on every advocate and firm card and page (max 3; essential cookie). */
export function CompareToggle({ pageId, initial, label, fullMessage }: { pageId: number; initial: boolean; label: string; fullMessage: string }) {
  const router = useRouter();
  const [on, setOn] = useState(initial);
  const [err, setErr] = useState("");
  const [, start] = useTransition();
  return (
    <label className={`cmp-check ${on ? "on" : ""}`}>
      <input
        type="checkbox"
        checked={on}
        aria-label={label}
        onChange={async (e) => {
          const next = e.target.checked;
          setErr("");
          const r = await post("/api/compare", { pageId, on: next });
          if (!r) {
            setErr(fullMessage);
            return;
          }
          setOn(next);
          start(() => router.refresh());
        }}
      />
      {label}
      {err ? <span className="err" role="alert">{err}</span> : null}
    </label>
  );
}

export function BookmarkButton({ pageId, initial, label }: { pageId: number; initial: boolean; label: string }) {
  const router = useRouter();
  const [on, setOn] = useState(initial);
  const [, start] = useTransition();
  return (
    <button
      type="button"
      className={`icon-btn ${on ? "on" : ""}`}
      aria-pressed={on}
      aria-label={label}
      title={label}
      onClick={async () => {
        const next = !on;
        const r = await post("/api/bookmarks", { pageId, on: next });
        if (r) {
          setOn(next);
          start(() => router.refresh());
        }
      }}
    >
      <svg className="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
    </button>
  );
}

export function ClearCompare({ label }: { label: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn btn-sm btn-ghost"
      onClick={async () => {
        document.cookie = "aid_cmp=; Max-Age=0; path=/";
        router.refresh();
      }}
    >
      {label}
    </button>
  );
}
