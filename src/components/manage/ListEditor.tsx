"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { del, post, put, type ApiFailure } from "@/lib/client-api";
import { useT } from "@/components/ui/LangProvider";
import { Icon } from "@/components/Icon";
import { HIGHLIGHT_LABELS, OUTCOME_LABELS, OUTCOMES, LANGUAGE_OPTIONS } from "@/lib/outcomes";
import { CourtPicker, TextField, type CourtOption } from "./Fields";
import { WordingNotice } from "./WordingNotice";

export type ListKind = "courts" | "categories" | "languages" | "career" | "highlights" | "links" | "cases" | "offices";

export interface EditorItem {
  id: number;
  title: string;
  subtitle?: string;
  raw: Record<string, any>;
}

export interface EditorOptions {
  categories?: { id: number; name: string }[];
  localities?: { id: number; name: string }[];
  districtCode?: string;
}

type Values = Record<string, any>;

const EMPTY: Record<ListKind, Values> = {
  courts: { court: null },
  categories: { categoryId: "" },
  languages: { languageCode: "en" },
  career: { yearFrom: "", yearTo: "", title: "", institution: "", description: "" },
  highlights: { number: "", label: HIGHLIGHT_LABELS[0] },
  links: { url: "", label: "" },
  cases: { court: null, role: "", year: "", outcome: "petition_allowed", note: "", link: "" },
  offices: { name: "", address: "", localityId: "", pincode: "", phone: "", hours: "", about: "", lat: "", lng: "", courts: [] as CourtOption[] },
};

const num = (v: any) => (v === "" || v == null ? null : Number(v));
const str = (v: any) => (typeof v === "string" && v.trim() ? v.trim() : null);

function payload(kind: ListKind, v: Values): Values {
  switch (kind) {
    case "courts": return { courtId: v.court?.id };
    case "categories": return { categoryId: Number(v.categoryId) };
    case "languages": return { languageCode: v.languageCode };
    case "career": return { yearFrom: num(v.yearFrom), yearTo: num(v.yearTo), title: v.title, institution: str(v.institution), description: str(v.description) };
    case "highlights": return { number: num(v.number), label: v.label };
    case "links": return { url: v.url, label: str(v.label) };
    case "cases": return { courtId: v.court?.id, role: v.role, year: num(v.year), outcome: v.outcome, note: str(v.note), link: str(v.link) };
    case "offices": return { name: v.name, address: str(v.address), localityId: num(v.localityId), pincode: str(v.pincode), phone: str(v.phone), hours: str(v.hours), about: str(v.about), lat: num(v.lat), lng: num(v.lng), courtIds: (v.courts as CourtOption[]).map((c) => c.id) };
  }
}

/**
 * Generic list editor: add, edit, remove and reorder with up/down arrows (courts, practice areas, languages,
 * career, highlights, links, case summaries, offices). Limits come from the server's entitlement module.
 */
export function ListEditor({
  pageId, kind, items, limit, options = {}, extra,
}: {
  pageId: number;
  kind: ListKind;
  items: EditorItem[];
  limit: number | null;
  options?: EditorOptions;
  /** Extra controls per item (e.g. office phone verification). */
  extra?: (item: EditorItem) => React.ReactNode;
}) {
  const t = useT();
  const router = useRouter();
  const [form, setForm] = useState<{ id?: number; values: Values } | null>(null);
  const [state, setState] = useState<{ error?: string; flags?: ApiFailure["flags"] }>({});
  const base = `/api/pages/${pageId}/lists/${kind}`;
  const movable = kind !== "cases";
  const editable = kind !== "courts" && kind !== "categories" && kind !== "languages";
  const full = limit !== null && items.length >= limit;
  const set = (k: string, v: any) => setForm((f) => (f ? { ...f, values: { ...f.values, [k]: v } } : f));

  async function submit(ack = false) {
    if (!form) return;
    setState({});
    const body = { ...payload(kind, form.values), acknowledgeWording: ack };
    const r = form.id ? await put(`${base}/${form.id}`, body) : await post(base, body);
    if (r.ok) { setForm(null); router.refresh(); } else setState({ error: (r as ApiFailure).flags ? undefined : (r as ApiFailure).message ?? (r as ApiFailure).fields?.map((x) => `${x.path}: ${x.message}`).join("; ") ?? t("form.error"), flags: (r as ApiFailure).flags });
  }

  const v = form?.values ?? {};
  return (
    <div className="stack">
      {limit !== null ? (
        <div>
          <div className="limit"><span>{t("list.used")}</span><span>{items.length} / {Number.isFinite(limit) ? limit : t("pricing.unlimited")}</span></div>
          <div className={`meter ${full ? "full" : ""}`}><i style={{ width: `${Math.min(100, (items.length / Math.max(1, limit)) * 100)}%` }} /></div>
          {limit === 0 ? <p className="upgrade-lock">{t("list.plan_required")} <Link href="/contact">{t("pricing.cta")}</Link></p> : null}
        </div>
      ) : null}
      <ul className="reorder">
        {items.map((it, i) => (
          <li key={it.id} className={limit !== null && i >= limit ? "beyond" : ""}>
            <span className="t"><strong>{it.title}</strong>{it.subtitle ? <span className="muted"> · {it.subtitle}</span> : null}{limit !== null && i >= limit ? <span className="chip" style={{ marginLeft: 8 }}>{t("list.hidden")}</span> : null}{extra?.(it)}</span>
            {movable ? <>
              <button type="button" className="icon-btn" aria-label={t("list.up")} disabled={i === 0} onClick={async () => { await post(`${base}/${it.id}/move`, { direction: "up" }); router.refresh(); }}><Icon name="up" size="sm" /></button>
              <button type="button" className="icon-btn" aria-label={t("list.down")} disabled={i === items.length - 1} onClick={async () => { await post(`${base}/${it.id}/move`, { direction: "down" }); router.refresh(); }}><Icon name="down" size="sm" /></button>
            </> : null}
            {editable ? <button type="button" className="icon-btn" aria-label={t("list.edit")} onClick={() => setForm({ id: it.id, values: { ...EMPTY[kind], ...it.raw } })}><Icon name="edit" size="sm" /></button> : null}
            <button type="button" className="icon-btn" aria-label={t("list.remove")} onClick={async () => { if (window.confirm(t("list.confirm_remove"))) { await del(`${base}/${it.id}`); router.refresh(); } }}><Icon name="trash" size="sm" /></button>
          </li>
        ))}
        {items.length === 0 ? <li className="muted">{t("list.empty")}</li> : null}
      </ul>

      {!form ? (
        <div><button type="button" className="btn btn-sm" disabled={full || limit === 0} onClick={() => setForm({ values: { ...EMPTY[kind] } })}><Icon name="plus" size="sm" />{t("list.add")}</button></div>
      ) : (
        <form className="card pad stack" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
          {(kind === "courts" || kind === "cases") ? <CourtPicker label={t("list.court")} value={v.court} onChange={(c) => set("court", c)} /> : null}
          {kind === "categories" ? (
            <div><label className="lbl" htmlFor="le-cat">{t("list.practice")}</label>
              <select id="le-cat" required value={v.categoryId} onChange={(e) => set("categoryId", e.target.value)}><option value="">{t("search.any")}</option>{options.categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          ) : null}
          {kind === "languages" ? (
            <div><label className="lbl" htmlFor="le-lang">{t("list.language")}</label>
              <select id="le-lang" value={v.languageCode} onChange={(e) => set("languageCode", e.target.value)}>{LANGUAGE_OPTIONS.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}</select></div>
          ) : null}
          {kind === "career" ? <>
            <div className="form-row two">
              <TextField id="le-yf" label={t("list.year_from")} type="number" value={String(v.yearFrom ?? "")} onChange={(x) => set("yearFrom", x)} check={false} required />
              <TextField id="le-yt" label={t("list.year_to")} type="number" value={String(v.yearTo ?? "")} onChange={(x) => set("yearTo", x)} check={false} hint={t("list.year_to_hint")} />
            </div>
            <TextField id="le-title" label={t("list.career_title")} value={v.title} onChange={(x) => set("title", x)} max={120} required />
            <TextField id="le-inst" label={t("list.institution")} value={v.institution ?? ""} onChange={(x) => set("institution", x)} max={120} />
            <TextField id="le-desc" label={t("list.description")} value={v.description ?? ""} onChange={(x) => set("description", x)} max={200} textarea rows={2} />
          </> : null}
          {kind === "highlights" ? (
            <div className="form-row two">
              <div><label className="lbl" htmlFor="le-hl">{t("list.highlight_label")}</label>
                <select id="le-hl" value={v.label} onChange={(e) => set("label", e.target.value)}>{HIGHLIGHT_LABELS.map((l) => <option key={l} value={l}>{l}</option>)}</select>
                <div className="hint">{t("list.highlight_hint")}</div></div>
              <TextField id="le-hn" label={t("list.highlight_number")} type="number" value={String(v.number ?? "")} onChange={(x) => set("number", x.slice(0, 3))} check={false} required />
            </div>
          ) : null}
          {kind === "links" ? <>
            <TextField id="le-url" label={t("list.link_url")} type="url" value={v.url} onChange={(x) => set("url", x)} max={500} check={false} required hint={t("list.link_hint")} />
            <TextField id="le-ll" label={t("list.link_label")} value={v.label ?? ""} onChange={(x) => set("label", x)} max={60} />
          </> : null}
          {kind === "cases" ? <>
            <TextField id="le-role" label={t("list.case_role")} value={v.role} onChange={(x) => set("role", x)} max={80} required hint={t("list.case_role_hint")} />
            <div className="form-row two">
              <TextField id="le-year" label={t("list.case_year")} type="number" value={String(v.year ?? "")} onChange={(x) => set("year", x)} check={false} required />
              <div><label className="lbl" htmlFor="le-out">{t("list.case_outcome")}</label>
                <select id="le-out" value={v.outcome} onChange={(e) => set("outcome", e.target.value)}>{OUTCOMES.map((o) => <option key={o} value={o}>{OUTCOME_LABELS[o]}</option>)}</select></div>
            </div>
            <TextField id="le-note" label={t("list.case_note")} value={v.note ?? ""} onChange={(x) => set("note", x)} max={200} textarea rows={2} hint={t("list.case_note_hint")} />
            <TextField id="le-link" label={t("list.case_link")} type="url" value={v.link ?? ""} onChange={(x) => set("link", x)} max={500} check={false} />
          </> : null}
          {kind === "offices" ? <>
            <TextField id="le-on" label={t("office.name")} value={v.name} onChange={(x) => set("name", x)} max={100} required />
            <TextField id="le-oa" label={t("office.address")} value={v.address ?? ""} onChange={(x) => set("address", x)} max={300} textarea rows={2} check={false} />
            <div className="form-row two">
              <div><label className="lbl" htmlFor="le-ol">{t("office.locality")}</label>
                <select id="le-ol" value={v.localityId ?? ""} onChange={(e) => set("localityId", e.target.value)}><option value="">{t("search.any")}</option>{options.localities?.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
              <TextField id="le-op" label={t("office.pincode")} value={v.pincode ?? ""} onChange={(x) => set("pincode", x.replace(/\D/g, "").slice(0, 6))} check={false} />
            </div>
            <div className="form-row two">
              <TextField id="le-ot" label={t("office.phone")} type="tel" value={v.phone ?? ""} onChange={(x) => set("phone", x)} max={20} check={false} hint={t("office.phone_hint")} />
              <TextField id="le-oh" label={t("office.hours")} value={v.hours ?? ""} onChange={(x) => set("hours", x)} max={120} />
            </div>
            <TextField id="le-oab" label={t("office.about")} value={v.about ?? ""} onChange={(x) => set("about", x)} max={200} textarea rows={3} hint={t("office.about_hint")} />
            <div className="form-row two">
              <TextField id="le-lat" label={t("office.lat")} type="number" value={String(v.lat ?? "")} onChange={(x) => set("lat", x)} check={false} />
              <TextField id="le-lng" label={t("office.lng")} type="number" value={String(v.lng ?? "")} onChange={(x) => set("lng", x)} check={false} />
            </div>
            <div>
              <span className="lbl">{t("office.focus_courts")}</span>
              <div className="chips">{(v.courts as CourtOption[]).map((c) => <span className="chip chip-brass" key={c.id}>{c.name} <button type="button" className="rm-col" aria-label={t("list.remove")} onClick={() => set("courts", (v.courts as CourtOption[]).filter((x) => x.id !== c.id))}>×</button></span>)}</div>
              {(v.courts as CourtOption[]).length < 10 ? <CourtPicker label={t("office.add_focus_court")} districtCode={options.districtCode} value={null} onChange={(c) => c && !(v.courts as CourtOption[]).some((x) => x.id === c.id) && set("courts", [...(v.courts as CourtOption[]), c])} /> : null}
            </div>
          </> : null}
          <WordingNotice flags={state.flags} onSaveAnyway={() => submit(true)} />
          {state.error ? <p className="err" role="alert">{state.error}</p> : null}
          <div className="row">
            <button className="btn btn-sm" type="submit" disabled={(kind === "courts" || kind === "cases") && !v.court}>{t("form.save")}</button>
            <button className="btn btn-sm btn-ghost" type="button" onClick={() => { setForm(null); setState({}); }}>{t("form.cancel")}</button>
          </div>
        </form>
      )}
    </div>
  );
}
