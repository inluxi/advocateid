"use client";
import { useEffect, useState } from "react";

/** Registers the service worker (installable app; offline page). Push notifications arrive in MVP 2. */
export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);
  return null;
}

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

/** Install prompt shown only when the browser offers it, once dismissed it stays away. */
export function InstallPrompt({ text, install, dismiss }: { text: string; install: string; dismiss: string }) {
  const [evt, setEvt] = useState<InstallEvent | null>(null);
  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem("aid_install_dismissed") === "1";
    } catch {
      /* storage may be blocked */
    }
    if (dismissed) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  if (!evt) return null;
  return (
    <div className="banner info" role="region" aria-label={install} style={{ margin: "12px auto", maxWidth: 1160 }}>
      <span style={{ flex: 1 }}>{text}</span>
      <button
        type="button"
        className="btn btn-sm"
        onClick={async () => {
          await evt.prompt();
          setEvt(null);
        }}
      >
        {install}
      </button>
      <button
        type="button"
        className="btn btn-sm btn-ghost"
        onClick={() => {
          try {
            localStorage.setItem("aid_install_dismissed", "1");
          } catch {
            /* ignore */
          }
          setEvt(null);
        }}
      >
        {dismiss}
      </button>
    </div>
  );
}
