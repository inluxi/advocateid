"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Near me: the browser asks for permission; the position is rounded to about 1 km, kept in a session cookie
 * and used only to sort results. It is never put in the URL, stored in the database or sent to analytics.
 */
export function NearMeButton({ href, label, note, denied }: { href: string; label: string; note: string; denied: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  return (
    <div>
      <button
        type="button"
        className="btn btn-outline btn-sm"
        onClick={() => {
          if (!navigator.geolocation) return setMsg(denied);
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const lat = pos.coords.latitude.toFixed(2);
              const lng = pos.coords.longitude.toFixed(2);
              document.cookie = `aid_near=${lat},${lng}; path=/; SameSite=Lax`;
              router.push(href);
            },
            () => setMsg(denied),
            { maximumAge: 600000, timeout: 8000 },
          );
        }}
      >
        {label}
      </button>
      <p className="inline-note">{msg || note}</p>
    </div>
  );
}
