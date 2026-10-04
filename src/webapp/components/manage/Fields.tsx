"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { checkWording } from "@/lib/wording";
import { get } from "@/lib/client-api";
import { useT } from "@/components/ui/LangProvider";

/** Text input / textarea with a character counter and the live Bar Council wording check (on input; the server checks again on save). */
export function TextField({
  id, label, value, onChange, max, textarea, check = true, hint, required, type = "text", rows,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void; max?: number; textarea?: boolean; check?: boolean; hint?: string; required?: boolean; type?: string; rows?: number;
}) {
  const t = useT();
  const result = useMemo(() => (check ? checkWording(value) : { flagged: false, found: [] }), [check, value]);
  const common = { id, value, required, maxLength: max, "aria-describedby": `${id}-d`, "aria-invalid": result.flagged || undefined, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value) };
  return (
    <div>
      <label className="lbl" htmlFor={id}>{label}{required ? <span className="req" aria-hidden="true"> *</span> : null}</label>
      {textarea ? <textarea {...common} rows={rows ?? 5} /> : <input {...common} type={type} />}
      <div id={`${id}-d`}>
        {hint ? <div className="hint">{hint}</div> : null}
        {max ? <div className="counter">{value.length} / {max}</div> : null}
        {result.flagged ? (
          <div className="wording-flag" role="status">
            {t("wording.inline")} {result.found.map((f) => `"${f.phrase}" (${f.suggestion})`).join(", ")}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export interface CourtOption {
  id: number;
  name: string;
  localName?: string | null;
  kind?: string;
}

/** Court search and select (the court list is admin-seeded; there is no free text and no way to add a court). */
export function CourtPicker({ value, onChange, label, districtCode, placeholder }: { value: CourtOption | null; onChange: (c: CourtOption | null) => void; label: string; districtCode?: string; placeholder?: string }) {
  const t = useT();
  const [q, setQ] = useState("");
  const [options, setOptions] = useState<CourtOption[]>([]);
  useEffect(() => {
    const h = setTimeout(async () => {
      const r = await get<{ courts: CourtOption[] }>(`/api/courts?q=${encodeURIComponent(q)}${districtCode ? `&d=${districtCode}` : ""}`);
      if (r.ok) setOptions((r as unknown as { courts: CourtOption[] }).courts);
    }, 200);
    return () => clearTimeout(h);
  }, [q, districtCode]);
  return (
    <div>
      <label className="lbl" htmlFor="court-q">{label}</label>
      {value ? (
        <div className="row"><span className="chip chip-brass">{value.name}</span><button type="button" className="rm-col" onClick={() => onChange(null)}>{t("form.change")}</button></div>
      ) : (
        <>
          <input id="court-q" type="search" value={q} placeholder={placeholder ?? t("court.search_ph")} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
          <ul className="list-clean" style={{ maxHeight: 190, overflow: "auto" }}>
            {options.map((c) => (
              <li key={c.id}><button type="button" className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "flex-start" }} onClick={() => onChange(c)}>{c.name}</button></li>
            ))}
            {options.length === 0 ? <li className="muted">{t("court.search_none")} <Link href="/contact?kind=court_request">{t("updates.missing_court")}</Link></li> : null}
          </ul>
        </>
      )}
    </div>
  );
}
