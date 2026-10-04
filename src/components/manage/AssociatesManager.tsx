"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { get, post, put, type ApiFailure } from "@/lib/client-api";
import { useT } from "@/components/ui/LangProvider";
import { Icon } from "@/components/Icon";
import { MembershipActions } from "@/components/account/AccountActions";
import { TextField } from "./Fields";
import { WordingNotice } from "./WordingNotice";

export interface LawyerRow { membershipId: number; name: string; slug: string; title: string; officeId: number | null; intro: string; beyond: boolean }
export interface FirmRow { membershipId: number; firmName: string; firmSlug: string; title: string; hideOnDomain: boolean }
export interface PendingRow { id: number; label: string; kind: "request" | "invite" }

interface Hit { id: number; name: string; slug: string; district: string }

function Finder({ type, onPick, label }: { type: "firm" | "advocate"; onPick: (h: Hit) => void; label: string }) {
  const t = useT();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  useEffect(() => {
    if (q.trim().length < 2) return;
    const h = setTimeout(async () => {
      const r = await get<{ pages: Hit[] }>(`/api/directory?type=${type}&q=${encodeURIComponent(q)}`);
      if (r.ok) setHits((r as unknown as { pages: Hit[] }).pages);
    }, 250);
    return () => clearTimeout(h);
  }, [q, type]);
  const shown = q.trim().length < 2 ? [] : hits;
  return (
    <div>
      <label className="lbl" htmlFor={`find-${type}`}>{label}</label>
      <input id={`find-${type}`} type="search" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
      <ul className="list-clean">{shown.map((h) => <li key={h.id}><button type="button" className="btn btn-ghost btn-sm" onClick={() => { onPick(h); setQ(""); setHits([]); }}>{h.name} <span className="muted">· {h.district}</span></button></li>)}
        {q.length >= 2 && shown.length === 0 ? <li className="muted">{t("assoc.none_found")}</li> : null}</ul>
    </div>
  );
}

export function FirmAssociates({ pageId, lawyers, offices, pending, slotsLeft, limitLabel }: { pageId: number; lawyers: LawyerRow[]; offices: { id: number; name: string }[]; pending: PendingRow[]; slotsLeft: boolean; limitLabel: string }) {
  const t = useT();
  const router = useRouter();
  const [edit, setEdit] = useState<LawyerRow | null>(null);
  const [invite, setInvite] = useState<{ hit: Hit | null; title: string; officeId: string }>({ hit: null, title: "", officeId: "" });
  const [state, setState] = useState<{ error?: string; ok?: boolean; flags?: ApiFailure["flags"] }>({});

  async function saveEdit(ack = false) {
    if (!edit) return;
    const r = await put(`/api/memberships/${edit.membershipId}`, { title: edit.title, officeId: edit.officeId, intro: edit.intro || null, acknowledgeWording: ack });
    if (r.ok) { setEdit(null); setState({}); router.refresh(); } else setState({ error: (r as ApiFailure).flags ? undefined : (r as ApiFailure).message, flags: (r as ApiFailure).flags });
  }
  return (
    <div className="stack">
      <p className="muted">{limitLabel}</p>
      {pending.length ? (
        <section className="card pad stack"><h2>{t("account.pending")}</h2>{pending.map((p) => <div key={p.id} className="row between"><span>{p.label}</span><MembershipActions id={p.id} kind={p.kind} /></div>)}</section>
      ) : null}
      <section className="card pad stack">
        <h2>{t("assoc.lawyers")}</h2>
        <ul className="reorder">
          {lawyers.map((l, i) => (
            <li key={l.membershipId} className={l.beyond ? "beyond" : ""}>
              <span className="t"><strong>{l.name}</strong> <span className="muted">· {l.title}{l.officeId ? ` · ${offices.find((o) => o.id === l.officeId)?.name ?? ""}` : ""}</span>{l.beyond ? <span className="chip" style={{ marginLeft: 8 }}>{t("list.hidden")}</span> : null}</span>
              <button type="button" className="icon-btn" aria-label={t("list.up")} disabled={i === 0} onClick={async () => { await post(`/api/memberships/${l.membershipId}/move`, { direction: "up", scope: "firm" }); router.refresh(); }}><Icon name="up" size="sm" /></button>
              <button type="button" className="icon-btn" aria-label={t("list.down")} disabled={i === lawyers.length - 1} onClick={async () => { await post(`/api/memberships/${l.membershipId}/move`, { direction: "down", scope: "firm" }); router.refresh(); }}><Icon name="down" size="sm" /></button>
              <button type="button" className="icon-btn" aria-label={t("list.edit")} onClick={() => setEdit(l)}><Icon name="edit" size="sm" /></button>
              <button type="button" className="icon-btn" aria-label={t("assoc.remove")} onClick={async () => { if (window.confirm(t("assoc.confirm_remove"))) { await post(`/api/memberships/${l.membershipId}`, { action: "remove" }); router.refresh(); } }}><Icon name="trash" size="sm" /></button>
            </li>
          ))}
          {lawyers.length === 0 ? <li className="muted">{t("list.empty")}</li> : null}
        </ul>
        {edit ? (
          <form className="card pad stack" onSubmit={(e) => { e.preventDefault(); void saveEdit(); }}>
            <TextField id="as-title" label={t("assoc.title")} value={edit.title} onChange={(v) => setEdit({ ...edit, title: v })} max={80} required />
            <div><label className="lbl" htmlFor="as-office">{t("assoc.office")}</label>
              <select id="as-office" value={edit.officeId ?? ""} onChange={(e) => setEdit({ ...edit, officeId: e.target.value ? Number(e.target.value) : null })}><option value="">-</option>{offices.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
            <TextField id="as-intro" label={t("assoc.intro")} value={edit.intro} onChange={(v) => setEdit({ ...edit, intro: v })} max={200} textarea rows={3} hint={t("assoc.intro_hint")} />
            <WordingNotice flags={state.flags} onSaveAnyway={() => saveEdit(true)} />
            {state.error ? <p className="err">{state.error}</p> : null}
            <div className="row"><button className="btn btn-sm" type="submit">{t("form.save")}</button><button className="btn btn-sm btn-ghost" type="button" onClick={() => setEdit(null)}>{t("form.cancel")}</button></div>
          </form>
        ) : null}
      </section>
      <section className="card pad stack">
        <h2>{t("assoc.invite")}</h2>
        <p className="muted">{t("assoc.invite_hint")}</p>
        {!slotsLeft ? <p className="upgrade-lock">{t("assoc.no_slots")} <Link href="/contact">{t("pricing.cta")}</Link></p> : (
          <>
            <Finder type="advocate" label={t("assoc.find_advocate")} onPick={(h) => setInvite({ ...invite, hit: h })} />
            {invite.hit ? <p><strong>{invite.hit.name}</strong></p> : null}
            <TextField id="inv-title" label={t("assoc.title")} value={invite.title} onChange={(v) => setInvite({ ...invite, title: v })} max={80} />
            <div><label className="lbl" htmlFor="inv-office">{t("assoc.office")}</label>
              <select id="inv-office" value={invite.officeId} onChange={(e) => setInvite({ ...invite, officeId: e.target.value })}><option value="">-</option>{offices.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
            {state.error && !edit ? <p className="err">{state.error}</p> : null}
            {state.ok ? <p className="ok-msg">{t("assoc.invited")}</p> : null}
            <div><button className="btn btn-sm" disabled={!invite.hit || invite.title.trim().length < 2} onClick={async () => {
              const r = await post(`/api/pages/${pageId}/invites`, { advocatePageId: invite.hit!.id, title: invite.title, officeId: invite.officeId ? Number(invite.officeId) : null });
              if (r.ok) { setState({ ok: true }); setInvite({ hit: null, title: "", officeId: "" }); router.refresh(); } else setState({ error: (r as ApiFailure).message });
            }}>{t("assoc.send_invite")}</button></div>
          </>
        )}
      </section>
    </div>
  );
}

export function AdvocateAssociates({ pageId, firms, pending }: { pageId: number; firms: FirmRow[]; pending: PendingRow[] }) {
  const t = useT();
  const router = useRouter();
  const [firm, setFirm] = useState<Hit | null>(null);
  const [title, setTitle] = useState("");
  const [state, setState] = useState<{ error?: string; ok?: boolean }>({});
  return (
    <div className="stack">
      {pending.length ? <section className="card pad stack"><h2>{t("account.pending")}</h2>{pending.map((p) => <div key={p.id} className="row between"><span>{p.label}</span><MembershipActions id={p.id} kind={p.kind} /></div>)}</section> : null}
      <section className="card pad stack">
        <h2>{t("assoc.member_of")}</h2>
        <ul className="list-clean">
          {firms.map((f) => (
            <li key={f.membershipId} className="row between">
              <span><strong>{f.firmName}</strong> <span className="muted">· {f.title}</span></span>
              <span className="row">
                <label className="switch"><input type="checkbox" checked={f.hideOnDomain} onChange={async (e) => { await post(`/api/memberships/${f.membershipId}`, { action: e.target.checked ? "hide" : "show" }); router.refresh(); }} /><span>{t("assoc.hide_on_domain")}</span></label>
                <button className="btn btn-sm btn-ghost" onClick={async () => { if (window.confirm(t("assoc.confirm_leave"))) { await post(`/api/memberships/${f.membershipId}`, { action: "leave" }); router.refresh(); } }}>{t("assoc.leave")}</button>
              </span>
            </li>
          ))}
          {firms.length === 0 ? <li className="muted">{t("assoc.no_firms")}</li> : null}
        </ul>
      </section>
      <section className="card pad stack">
        <h2>{t("assoc.request")}</h2>
        <p className="muted">{t("assoc.request_hint")}</p>
        <Finder type="firm" label={t("assoc.find_firm")} onPick={setFirm} />
        {firm ? <p><strong>{firm.name}</strong></p> : null}
        <TextField id="rq-title" label={t("assoc.title")} value={title} onChange={setTitle} max={80} />
        {state.error ? <p className="err" role="alert">{state.error}</p> : null}
        {state.ok ? <p className="ok-msg">{t("assoc.requested")}</p> : null}
        <div><button className="btn btn-sm" disabled={!firm || title.trim().length < 2} onClick={async () => {
          const r = await post("/api/memberships", { advocatePageId: pageId, firmPageId: firm!.id, title, officeId: null });
          if (r.ok) { setState({ ok: true }); setFirm(null); setTitle(""); router.refresh(); } else setState({ error: (r as ApiFailure).message });
        }}>{t("assoc.send_request")}</button></div>
      </section>
    </div>
  );
}
