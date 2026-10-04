"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { csrfToken } from "@/lib/client-api";
import { flushPending, uploadImage, type UploadStatus } from "@/lib/image-client";
import { useT } from "@/components/ui/LangProvider";

/** Picture upload: resized on the phone, uploaded in the background with progress. */
export function ImageUploader({ pageId, kind, currentUrl, label, hint, locked }: { pageId: number; kind: "photo" | "banner"; currentUrl: string | null; label: string; hint: string; locked?: string }) {
  const t = useT();
  const router = useRouter();
  const [status, setStatus] = useState<UploadStatus>({ state: "idle" });
  useEffect(() => {
    void flushPending((s) => s.state === "done" && router.refresh());
  }, [router]);
  if (locked) return <div className="upgrade-lock"><strong>{label}</strong><p>{locked}</p></div>;
  const onStatus = (s: UploadStatus) => {
    setStatus(s);
    if (s.state === "done") router.refresh();
  };
  return (
    <div>
      <label className="lbl" htmlFor={`img-${kind}`}>{label}</label>
      <div className="row">
        {currentUrl ? <img src={currentUrl} alt="" width={kind === "photo" ? 72 : 160} height={72} style={{ objectFit: "cover", borderRadius: 10, height: 72 }} /> : null}
        <input
          id={`img-${kind}`}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const token = (await csrfToken()) ?? "";
            await uploadImage({ pageId, kind, file: f, csrf: token, onStatus });
          }}
        />
      </div>
      <div className="hint">{hint}</div>
      {status.state === "resizing" ? <p role="status">{t("image.resizing")}</p> : null}
      {status.state === "uploading" ? <div className="meter" role="progressbar" aria-valuenow={status.pct} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${status.pct}%` }} /></div> : null}
      {status.state === "queued" ? <p role="status">{t("image.queued")}</p> : null}
      {status.state === "done" ? <p className="ok-msg" role="status">{t("image.done")}</p> : null}
      {status.state === "error" ? <p className="err" role="alert">{t(`image.error.${status.message}`) !== `image.error.${status.message}` ? t(`image.error.${status.message}`) : t("image.error.generic")}</p> : null}
    </div>
  );
}
