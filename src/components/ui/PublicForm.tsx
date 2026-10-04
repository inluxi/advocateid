"use client";
import { useEffect, useState } from "react";

export interface FormField {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "tel";
  required?: boolean;
  max?: number;
  options?: { value: string; label: string }[];
  defaultValue?: string;
  hint?: string;
}

/** Public form with the arithmetic check (no third-party script). Used by contact, grievance and report. */
export function PublicForm({
  endpoint, fields, hidden = {}, submitLabel, successText, captchaLabel, sendingLabel,
}: {
  endpoint: string;
  fields: FormField[];
  hidden?: Record<string, string | number>;
  submitLabel: string;
  successText: string;
  captchaLabel: string;
  sendingLabel: string;
}) {
  const [captcha, setCaptcha] = useState<{ question: string; token: string } | null>(null);
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? ""])));
  const [answer, setAnswer] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const load = () => fetch("/api/captcha", { cache: "no-store" }).then((r) => r.json()).then(setCaptcha).catch(() => undefined);
  useEffect(() => {
    void load();
  }, []);
  if (state === "done") return <p className="ok-msg" role="status">{successText}{reference ? ` ${reference}` : ""}</p>;
  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!captcha) return;
        setState("sending");
        setError("");
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...Object.fromEntries(Object.entries(values).map(([k, v]) => [k, /Id$/.test(k) && /^\d+$/.test(v) ? Number(v) : v])), ...hidden, captchaToken: captcha.token, captchaAnswer: answer }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setReference(data.reference ?? "");
          setState("done");
        } else {
          setError(data.message ?? data.error ?? "Error");
          setState("idle");
          setAnswer("");
          void load();
        }
      }}
    >
      {fields.map((f) => (
        <div key={f.name}>
          <label className="lbl" htmlFor={`pf-${f.name}`}>{f.label}{f.required ? <span className="req" aria-hidden="true"> *</span> : null}</label>
          {f.type === "textarea" ? (
            <textarea id={`pf-${f.name}`} required={f.required} maxLength={f.max} value={values[f.name]} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} />
          ) : f.type === "select" ? (
            <select id={`pf-${f.name}`} required={f.required} value={values[f.name]} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}>
              {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ) : (
            <input id={`pf-${f.name}`} type={f.type} required={f.required} maxLength={f.max} value={values[f.name]} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} />
          )}
          {f.hint ? <div className="hint">{f.hint}</div> : null}
        </div>
      ))}
      <div>
        <label className="lbl" htmlFor="pf-captcha">{captchaLabel} {captcha?.question ?? "…"} = ?</label>
        <input id="pf-captcha" inputMode="numeric" required maxLength={3} value={answer} onChange={(e) => setAnswer(e.target.value)} style={{ maxWidth: 120 }} />
      </div>
      {error ? <p className="err" role="alert">{error}</p> : null}
      <button className="btn" type="submit" disabled={state === "sending" || !captcha} aria-busy={state === "sending"}>{state === "sending" ? sendingLabel : submitLabel}</button>
    </form>
  );
}
