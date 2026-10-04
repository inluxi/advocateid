"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { post } from "@/lib/client-api";
import { useT } from "@/components/ui/LangProvider";

/**
 * The Connect number (WhatsApp and call). Defaults to the login number; a different number needs an OTP
 * (it is never used to log in) and specific consent, because it is shown publicly.
 */
export function ContactNumber({ pageId, shown, endpoint, verifyEndpoint, label }: { pageId: number; shown: string; endpoint?: string; verifyEndpoint?: string; label?: string }) {
  const t = useT();
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [consent, setConsent] = useState(false);
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"idle" | "otp" | "done">("idle");
  const [error, setError] = useState("");
  const ep = endpoint ?? `/api/pages/${pageId}/contact`;
  const vep = verifyEndpoint ?? `/api/pages/${pageId}/contact/verify`;
  return (
    <fieldset className="stack" style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 14 }}>
      <legend>{label ?? t("contact_number.title")}</legend>
      <p className="muted" style={{ margin: 0 }}>{t("contact_number.current", { mobile: shown })}</p>
      {step === "done" ? <p className="ok-msg" role="status">{t("contact_number.done")}</p> : null}
      {step !== "otp" ? (
        <>
          <label className="lbl" htmlFor={`cn-${pageId}`}>{t("contact_number.new")}</label>
          <input id={`cn-${pageId}`} type="tel" value={mobile} maxLength={20} onChange={(e) => setMobile(e.target.value)} />
          <label className="switch"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /><span>{t("contact_number.consent")}</span></label>
          <button type="button" className="btn btn-sm" disabled={!mobile} onClick={async () => {
            setError("");
            const r = await post<{ needsOtp: boolean }>(ep, { mobile, consent });
            if (!r.ok) return setError((r as { message?: string }).message ?? t("form.error"));
            if ((r as unknown as { needsOtp: boolean }).needsOtp !== false) setStep("otp");
            else { setStep("done"); router.refresh(); }
          }}>{t("contact_number.send_otp")}</button>
        </>
      ) : (
        <>
          <label className="lbl" htmlFor={`cn-otp-${pageId}`}>{t("login.otp")}</label>
          <input id={`cn-otp-${pageId}`} inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} />
          <button type="button" className="btn btn-sm" disabled={otp.length !== 6} onClick={async () => {
            setError("");
            const r = await post(vep, { mobile, otp });
            if (!r.ok) return setError((r as { message?: string }).message ?? t("form.error"));
            setStep("done"); setOtp(""); setMobile(""); router.refresh();
          }}>{t("login.verify")}</button>
        </>
      )}
      {error ? <p className="err" role="alert">{error}</p> : null}
    </fieldset>
  );
}
