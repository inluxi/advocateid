"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ButtonEl } from "@/components/Button";

/**
 * Reads the browser's geolocation and navigates to /near-me?lat=..&lng=..
 * This only reads a browser API and redirects — no data is written — so
 * it's in scope for the read-only Phase 0 build.
 */
export function GeolocateButton() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "locating" | "error">("idle");

  function locate() {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        router.push(`/near-me?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`);
      },
      () => setStatus("error"),
    );
  }

  return (
    <div>
      <ButtonEl onClick={locate} variant="primary" size="lg" disabled={status === "locating"}>
        {status === "locating" ? "Locating…" : "Use my location"}
      </ButtonEl>
      {status === "error" ? (
        <p className="mt-2 text-small text-error">
          Couldn&apos;t get your location. Please allow location access and try again.
        </p>
      ) : null}
    </div>
  );
}
