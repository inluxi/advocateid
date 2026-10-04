"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { post } from "@/lib/client-api";
import { useT } from "@/components/ui/LangProvider";
import { ListEditor, type EditorItem, type EditorOptions } from "./ListEditor";

export interface OfficeItem extends EditorItem {
  isMain: boolean;
  phoneVerified: boolean;
  hasPhone: boolean;
}

function VerifyPhone({ pageId, officeId }: { pageId: number; officeId: number }) {
  const t = useT();
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "consent" | "otp">("idle");
  const [consent, setConsent] = useState(false);
  const [otp, setOtp] = useState("");
  const [err, setErr] = useState("");
  const base = `/api/pages/${pageId}/offices/${officeId}/phone`;
  if (step === "idle") return <button type="button" className="btn btn-sm btn-ghost" onClick={() => setStep("consent")}>{t("office.verify")}</button>;
  return (
    <div className="stack" style={{ marginTop: 8 }}>
      {step === "consent" ? (
        <>
          <label className="switch"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /><span>{t("contact_number.consent")}</span></label>
          <button type="button" className="btn btn-sm" onClick={async () => { const r = await post(base, { consent }); if (r.ok) { setStep("otp"); setErr(""); } else setErr((r as { message?: string }).message ?? t("form.error")); }}>{t("contact_number.send_otp")}</button>
        </>
      ) : (
        <div className="inline-form">
          <input aria-label={t("login.otp")} inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} />
          <button type="button" className="btn btn-sm" disabled={otp.length !== 6} onClick={async () => { const r = await post(`${base}/verify`, { otp }); if (r.ok) { setStep("idle"); router.refresh(); } else setErr((r as { message?: string }).message ?? t("form.error")); }}>{t("login.verify")}</button>
        </div>
      )}
      {err ? <p className="err" role="alert">{err}</p> : null}
    </div>
  );
}

/** Offices: own page, own mobile number (OTP; not used for login), focus courts, local description, lat/lng. */
export function OfficeManager({ pageId, items, limit, options }: { pageId: number; items: OfficeItem[]; limit: number | null; options: EditorOptions }) {
  const t = useT();
  const router = useRouter();
  const byId = new Map(items.map((i) => [i.id, i]));
  return (
    <ListEditor
      pageId={pageId}
      kind="offices"
      items={items}
      limit={limit}
      options={options}
      extra={(it) => {
        const o = byId.get(it.id)!;
        return (
          <span style={{ display: "block" }}>
            {o.isMain ? <span className="pill ok">{t("profile.main_office")}</span> : <button type="button" className="rm-col" onClick={async () => { await post(`/api/pages/${pageId}/offices/${o.id}/main`); router.refresh(); }}>{t("office.make_main")}</button>}
            {o.hasPhone ? <span className={`pill ${o.phoneVerified ? "ok" : "wait"}`} style={{ marginLeft: 8 }}>{o.phoneVerified ? t("office.phone_verified") : t("office.phone_unverified")}</span> : null}
            {o.hasPhone && !o.phoneVerified ? <VerifyPhone pageId={pageId} officeId={o.id} /> : null}
          </span>
        );
      }}
    />
  );
}
