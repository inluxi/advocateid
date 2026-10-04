"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useT } from "@/components/ui/LangProvider";

/** Mobile OTP login. The privacy notice and a specific, withdrawable consent come before the number is collected. */
export function LoginForm({ next }: { next: string }) {
  const t = useT();
  const router = useRouter();
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/account";

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/otp/send", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mobile, consent }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) setStep("otp");
    else setError(res.status === 429 ? t("login.rate_limited") : data.error === "invalid_input" ? t("login.consent_required") : (data.message ?? t("login.failed")));
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/otp/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mobile, otp }) });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      router.push(data.isNew ? "/manage/new" : safeNext);
      router.refresh();
      return;
    }
    setBusy(false);
    setError(data.message ?? t("login.failed"));
  }

  if (step === "otp") {
    return (
      <form className="stack" onSubmit={verify}>
        <div>
          <label className="lbl" htmlFor="otp">{t("login.otp")}</label>
          <input id="otp" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} />
          <div className="hint">{t("login.otp_hint")}</div>
        </div>
        {error ? <p className="err" role="alert">{error}</p> : null}
        <button className="btn btn-block" disabled={busy || otp.length !== 6} aria-busy={busy}>{t("login.verify")}</button>
        <button type="button" className="btn btn-ghost btn-block" onClick={() => { setStep("mobile"); setOtp(""); setError(""); }}>{t("login.change_number")}</button>
      </form>
    );
  }
  return (
    <form className="stack" onSubmit={send}>
      <div className="notice">
        <strong>{t("login.notice.title")}</strong>
        <p style={{ margin: "6px 0 0" }}>{t("login.notice.body")} <Link href="/privacy">{t("login.notice.link")}</Link></p>
      </div>
      <div>
        <label className="lbl" htmlFor="mobile">{t("login.mobile")}</label>
        <input id="mobile" type="tel" inputMode="tel" autoComplete="tel-national" required maxLength={20} placeholder="98765 43210" value={mobile} onChange={(e) => setMobile(e.target.value)} />
        <div className="hint">{t("login.mobile_hint")}</div>
      </div>
      <label className="switch">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
        <span>{t("login.consent")}</span>
      </label>
      {error ? <p className="err" role="alert">{error}</p> : null}
      <button className="btn btn-block" disabled={busy || !consent} aria-busy={busy}>{t("login.send")}</button>
    </form>
  );
}
