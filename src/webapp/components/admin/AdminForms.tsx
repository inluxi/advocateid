"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { post, put, csrfToken } from "@/lib/client-api";
import { useT } from "@/components/ui/LangProvider";
import { CourtPicker, type CourtOption } from "@/components/manage/Fields";

export function CourtImport() {
  const t = useT();
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok?: boolean; text: string; errors?: { row: number; message: string }[] } | null>(null);
  return (
    <form className="card pad stack" onSubmit={async (e) => {
      e.preventDefault();
      const file = (e.currentTarget.elements.namedItem("file") as HTMLInputElement).files?.[0];
      if (!file) return;
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/admin/courts/import", { method: "POST", headers: { "x-csrf-token": (await csrfToken()) ?? "" }, body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { setMsg({ ok: true, text: t("admin.courts.imported", { inserted: data.inserted, updated: data.updated, localities: data.localitiesCreated }) }); router.refresh(); }
      else setMsg({ text: data.message ?? t("form.error"), errors: data.errors });
    }}>
      <h2>{t("admin.courts.import")}</h2>
      <p className="muted">{t("admin.courts.import_hint")}</p>
      <pre className="share-box" style={{ overflowX: "auto" }}>id, name, local_name, kind, state, district_code, city, locality, address, pincode, latitude, longitude</pre>
      <input name="file" type="file" accept=".csv,text/csv" required />
      <div><button className="btn" type="submit">{t("admin.courts.upload")}</button></div>
      {msg ? <p className={msg.ok ? "ok-msg" : "err"} role="status">{msg.text}</p> : null}
      {msg?.errors ? <ul className="bullets">{msg.errors.map((e, i) => <li key={i}>{e.row ? `Row ${e.row}: ` : ""}{e.message}</li>)}</ul> : null}
    </form>
  );
}

export interface CourtForm { id: number; name: string; localName: string; kind: string; address: string; pincode: string; lat: string; lng: string; website: string; details: { keyName: string; value: string }[] }

export function CourtEditor({ initial }: { initial: CourtForm }) {
  const t = useT();
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [msg, setMsg] = useState("");
  const set = (k: keyof CourtForm, v: any) => setF((p) => ({ ...p, [k]: v }));
  const field = (k: keyof CourtForm, label: string) => (<div><label className="lbl" htmlFor={`ce-${k}`}>{label}</label><input id={`ce-${k}`} value={f[k] as string} onChange={(e) => set(k, e.target.value)} /></div>);
  return (
    <form className="card pad stack" onSubmit={async (e) => {
      e.preventDefault();
      const r = await put(`/api/admin/courts/${f.id}`, {
        name: f.name, localName: f.localName || null, kind: f.kind, address: f.address || null, pincode: f.pincode || null,
        lat: f.lat ? Number(f.lat) : null, lng: f.lng ? Number(f.lng) : null, website: f.website || null,
        details: f.details.filter((d) => d.keyName.trim() && d.value.trim()),
      });
      setMsg(r.ok ? t("form.saved") : (r as { message?: string }).message ?? t("form.error"));
      if (r.ok) router.refresh();
    }}>
      {field("name", t("admin.courts.name"))}{field("localName", t("admin.courts.local_name"))}{field("kind", t("admin.courts.kind"))}
      {field("address", t("office.address"))}{field("pincode", t("office.pincode"))}
      <div className="form-row two">{field("lat", t("office.lat"))}{field("lng", t("office.lng"))}</div>
      {field("website", t("admin.courts.website"))}
      <fieldset className="stack" style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 14 }}>
        <legend>{t("admin.courts.details")}</legend>
        {f.details.map((d, i) => (
          <div className="inline-form" key={i}>
            <input aria-label={t("admin.courts.key")} placeholder={t("admin.courts.key")} value={d.keyName} onChange={(e) => set("details", f.details.map((x, j) => (j === i ? { ...x, keyName: e.target.value } : x)))} />
            <input aria-label={t("admin.courts.value")} placeholder={t("admin.courts.value")} value={d.value} onChange={(e) => set("details", f.details.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => set("details", f.details.filter((_, j) => j !== i))}>{t("list.remove")}</button>
          </div>
        ))}
        <div><button type="button" className="btn btn-sm btn-outline" onClick={() => set("details", [...f.details, { keyName: "", value: "" }])}>{t("list.add")}</button></div>
      </fieldset>
      {msg ? <p role="status">{msg}</p> : null}
      <div><button className="btn" type="submit">{t("form.save")}</button></div>
    </form>
  );
}

export function UpdateForm() {
  const t = useT();
  const router = useRouter();
  const [court, setCourt] = useState<CourtOption | null>(null);
  const [f, setF] = useState({ title: "", body: "", sourceUrl: "" });
  const [msg, setMsg] = useState("");
  return (
    <form className="card pad stack" onSubmit={async (e) => {
      e.preventDefault();
      const r = await post("/api/admin/updates", { ...f, courtId: court?.id, language: "en", acknowledgeWording: true });
      if (r.ok) { setF({ title: "", body: "", sourceUrl: "" }); setCourt(null); setMsg(t("form.saved")); router.refresh(); } else setMsg((r as { message?: string }).message ?? t("form.error"));
    }}>
      <h2>{t("admin.updates.new")}</h2>
      <CourtPicker label={t("list.court")} value={court} onChange={setCourt} />
      <div><label className="lbl" htmlFor="au-t">{t("contribute.title")}</label><input id="au-t" required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
      <div><label className="lbl" htmlFor="au-b">{t("posts.body")}</label><textarea id="au-b" required rows={8} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></div>
      <div><label className="lbl" htmlFor="au-s">{t("contribute.source")}</label><input id="au-s" type="url" required value={f.sourceUrl} onChange={(e) => setF({ ...f, sourceUrl: e.target.value })} /></div>
      {msg ? <p role="status">{msg}</p> : null}
      <div><button className="btn" type="submit" disabled={!court}>{t("posts.publish")}</button></div>
    </form>
  );
}

export function ReportActions({ id, targetType, targetId }: { id: number; targetType: string; targetId: number }) {
  const t = useT();
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  const done = async (status: "actioned" | "dismissed") => { await post(`/api/admin/reports/${id}`, { status }); router.refresh(); };
  return (
    <div className="stack">
      <div className="inline-form">
        <input aria-label={t("admin.reason")} placeholder={t("admin.reason")} value={reason} onChange={(e) => setReason(e.target.value)} />
        <button className="btn btn-sm" disabled={reason.trim().length < 3} onClick={async () => {
          const r = targetType === "page" ? await post(`/api/admin/pages/${targetId}`, { action: "suspend", suspend: true, reason }) : await post(`/api/admin/posts/${targetId}`, { suspend: true, reason });
          if (!r.ok) return setErr((r as { message?: string }).message ?? t("form.error"));
          await done("actioned");
        }}>{t("admin.suspend")}</button>
        <button className="btn btn-sm btn-ghost" onClick={() => done("dismissed")}>{t("admin.dismiss")}</button>
      </div>
      {err ? <p className="err">{err}</p> : null}
    </div>
  );
}

export function PageAdmin({ id, plan, status, slug }: { id: number; plan: string; status: string; slug: string }) {
  const t = useT();
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState("");
  const run = async (body: Record<string, unknown>) => { const r = await post(`/api/admin/pages/${id}`, body); setMsg(r.ok ? t("form.saved") : (r as { message?: string }).message ?? t("form.error")); if (r.ok) router.refresh(); };
  return (
    <div className="stack">
      <div className="inline-form">
        <select aria-label={t("manage.nav.plan")} defaultValue={plan} onChange={(e) => run({ action: "plan", plan: e.target.value, reason: reason || undefined })}>
          {["basic", "professional", "premium"].map((p) => <option key={p} value={p}>{t(`plan.${p}`)}</option>)}
        </select>
        <input aria-label={t("admin.reason")} placeholder={t("admin.reason")} value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>
      <div className="row">
        {status === "suspended" ? <button className="btn btn-sm" onClick={() => run({ action: "suspend", suspend: false, reason: reason || "restored" })}>{t("admin.restore")}</button> : <button className="btn btn-sm btn-ghost" disabled={reason.trim().length < 3} onClick={() => run({ action: "suspend", suspend: true, reason })}>{t("admin.suspend")}</button>}
        <button className="btn btn-sm btn-ghost" disabled={reason.trim().length < 3} onClick={() => { if (window.confirm(t("admin.confirm_recall", { slug }))) void run({ action: "recall_slug", reason }); }}>{t("admin.recall")}</button>
      </div>
      {msg ? <p role="status">{msg}</p> : null}
    </div>
  );
}

export function GrievanceStatus({ id, status }: { id: number; status: string }) {
  const t = useT();
  const router = useRouter();
  return (
    <select aria-label={t("admin.status")} defaultValue={status} onChange={async (e) => { await post(`/api/admin/grievances/${id}`, { status: e.target.value }); router.refresh(); }}>
      {["open", "in_progress", "resolved"].map((s) => <option key={s} value={s}>{t(`admin.grievance.${s}`)}</option>)}
    </select>
  );
}

export function CategoryForm() {
  const t = useT();
  const router = useRouter();
  const [f, setF] = useState({ code: "", slug: "", name: "", ml: "" });
  const [msg, setMsg] = useState("");
  return (
    <form className="card pad stack" onSubmit={async (e) => { e.preventDefault(); const r = await post("/api/admin/categories", { ...f, ml: f.ml || null }); setMsg(r.ok ? t("form.saved") : (r as { message?: string }).message ?? t("form.error")); if (r.ok) { setF({ code: "", slug: "", name: "", ml: "" }); router.refresh(); } }}>
      <h2>{t("admin.categories.add")}</h2>
      <div className="form-row two">
        <div><label className="lbl" htmlFor="ac-c">{t("admin.code")}</label><input id="ac-c" required value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toLowerCase() })} maxLength={6} /></div>
        <div><label className="lbl" htmlFor="ac-s">{t("admin.slug")}</label><input id="ac-s" required value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value.toLowerCase() })} /></div>
      </div>
      <div className="form-row two">
        <div><label className="lbl" htmlFor="ac-n">{t("admin.name")}</label><input id="ac-n" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div><label className="lbl" htmlFor="ac-m">{t("admin.name_ml")}</label><input id="ac-m" lang="ml" value={f.ml} onChange={(e) => setF({ ...f, ml: e.target.value })} /></div>
      </div>
      {msg ? <p role="status">{msg}</p> : null}
      <div><button className="btn" type="submit">{t("form.save")}</button></div>
    </form>
  );
}

export function LocalityForm({ parents }: { parents: { id: number; name: string }[] }) {
  const t = useT();
  const router = useRouter();
  const [f, setF] = useState({ code: "", name: "", localName: "", parentId: parents[0]?.id ?? 0, level: "city" });
  const [msg, setMsg] = useState("");
  return (
    <form className="card pad stack" onSubmit={async (e) => { e.preventDefault(); const r = await post("/api/admin/localities", { ...f, localName: f.localName || null }); setMsg(r.ok ? t("form.saved") : (r as { message?: string }).message ?? t("form.error")); if (r.ok) { setF({ ...f, code: "", name: "", localName: "" }); router.refresh(); } }}>
      <h2>{t("admin.localities.add")}</h2>
      <div className="form-row two">
        <div><label className="lbl" htmlFor="al-c">{t("admin.code")}</label><input id="al-c" required value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toLowerCase() })} maxLength={8} /></div>
        <div><label className="lbl" htmlFor="al-n">{t("admin.name")}</label><input id="al-n" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
      </div>
      <div className="form-row two">
        <div><label className="lbl" htmlFor="al-m">{t("admin.name_ml")}</label><input id="al-m" lang="ml" value={f.localName} onChange={(e) => setF({ ...f, localName: e.target.value })} /></div>
        <div><label className="lbl" htmlFor="al-p">{t("admin.parent")}</label><select id="al-p" value={f.parentId} onChange={(e) => setF({ ...f, parentId: Number(e.target.value) })}>{parents.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
      </div>
      <div><label className="lbl" htmlFor="al-l">{t("admin.level")}</label><select id="al-l" value={f.level} onChange={(e) => setF({ ...f, level: e.target.value })}><option value="city">city</option><option value="locality">locality</option></select></div>
      {msg ? <p role="status">{msg}</p> : null}
      <div><button className="btn" type="submit">{t("form.save")}</button></div>
    </form>
  );
}
