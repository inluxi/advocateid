"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { put, type ApiFailure } from "@/lib/client-api";
import { useT } from "@/components/ui/LangProvider";
import { ABOUT_MAX, BIO_MAX } from "@/lib/entitlements";
import { TextField } from "./Fields";
import { WordingNotice } from "./WordingNotice";

export interface ProfileFormData {
  id: number;
  type: "advocate" | "firm";
  plan: string;
  name: string;
  bio: string;
  about: string;
  districtId: number;
  language: "en" | "ml";
  enrolmentNo: string;
  yearEnrolled: number | null;
  establishedYear: number | null;
  seoTitle: string;
  seoDescription: string;
  photoAlt: string;
  bannerAlt: string;
  brandColour: string;
  showMemberOf: boolean;
  allowMembers: boolean;
  canBrand: boolean;
  canToggleMemberOf: boolean;
  canApprove: boolean;
}

export function ProfileForm({ initial, districts }: { initial: ProfileFormData; districts: { id: number; name: string }[] }) {
  const t = useT();
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [msg, setMsg] = useState<{ ok?: boolean; text?: string; flags?: ApiFailure["flags"] }>({});
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof ProfileFormData>(k: K, v: ProfileFormData[K]) => setF((p) => ({ ...p, [k]: v }));

  async function save(ack = false) {
    setBusy(true);
    setMsg({});
    const body: Record<string, unknown> = {
      name: f.name, bio: f.bio, about: f.about, districtId: f.districtId, language: f.language,
      seoTitle: f.seoTitle, seoDescription: f.seoDescription, photoAlt: f.photoAlt, bannerAlt: f.bannerAlt,
      acknowledgeWording: ack,
    };
    if (f.type === "advocate") { body.enrolmentNo = f.enrolmentNo; body.yearEnrolled = f.yearEnrolled; } else body.establishedYear = f.establishedYear;
    if (f.canBrand) body.brandColour = f.brandColour || null;
    if (f.canToggleMemberOf) body.showMemberOf = f.showMemberOf;
    if (f.type === "firm" && f.canApprove) body.allowMembers = f.allowMembers;
    const r = await put(`/api/pages/${f.id}`, body);
    setBusy(false);
    if (r.ok) { setMsg({ ok: true, text: t("form.saved") }); router.refresh(); }
    else setMsg({ text: (r as ApiFailure).flags ? undefined : (r as ApiFailure).message ?? t("form.error"), flags: (r as ApiFailure).flags });
  }

  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); void save(); }}>
      <TextField id="pf-name" label={t("editor.name")} value={f.name} onChange={(v) => set("name", v)} max={120} required />
      <TextField id="pf-bio" label={t("editor.bio")} hint={t("editor.bio_hint")} value={f.bio} onChange={(v) => set("bio", v)} max={BIO_MAX} textarea rows={4} />
      <TextField id="pf-about" label={t("editor.about")} hint={t("editor.about_hint")} value={f.about} onChange={(v) => set("about", v)} max={ABOUT_MAX} textarea rows={9} />
      <div className="form-row two">
        <div>
          <label className="lbl" htmlFor="pf-district">{t("editor.district")}</label>
          <select id="pf-district" value={f.districtId} onChange={(e) => set("districtId", Number(e.target.value))}>
            {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="lbl" htmlFor="pf-lang">{t("editor.language")}</label>
          <select id="pf-lang" value={f.language} onChange={(e) => set("language", e.target.value as "en" | "ml")}>
            <option value="en">English</option>
            <option value="ml">Malayalam</option>
          </select>
          <div className="hint">{t("editor.language_hint")}</div>
        </div>
      </div>
      {f.type === "advocate" ? (
        <div className="form-row two">
          <TextField id="pf-enrol" label={t("editor.enrolment")} hint={t("editor.enrolment_hint")} value={f.enrolmentNo} onChange={(v) => set("enrolmentNo", v)} max={40} check={false} required />
          <TextField id="pf-year" label={t("editor.year_enrolled")} type="number" value={f.yearEnrolled?.toString() ?? ""} onChange={(v) => set("yearEnrolled", v ? Number(v) : null)} check={false} />
        </div>
      ) : (
        <TextField id="pf-est" label={t("editor.established")} type="number" value={f.establishedYear?.toString() ?? ""} onChange={(v) => set("establishedYear", v ? Number(v) : null)} check={false} />
      )}
      <fieldset className="stack" style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 14 }}>
        <legend>{t("editor.seo")}</legend>
        <TextField id="pf-seot" label={t("editor.seo_title")} value={f.seoTitle} onChange={(v) => set("seoTitle", v)} max={70} />
        <TextField id="pf-seod" label={t("editor.seo_description")} value={f.seoDescription} onChange={(v) => set("seoDescription", v)} max={160} textarea rows={2} />
        <div className="form-row two">
          <TextField id="pf-palt" label={t("editor.photo_alt")} value={f.photoAlt} onChange={(v) => set("photoAlt", v)} max={120} />
          <TextField id="pf-balt" label={t("editor.banner_alt")} value={f.bannerAlt} onChange={(v) => set("bannerAlt", v)} max={120} />
        </div>
      </fieldset>
      {f.canBrand ? (
        <div>
          <label className="lbl" htmlFor="pf-brand">{t("editor.brand")}</label>
          <input id="pf-brand" type="color" value={f.brandColour || "#16233f"} onChange={(e) => set("brandColour", e.target.value)} style={{ maxWidth: 120, padding: 2 }} />
          <div className="hint">{t("editor.brand_hint")}</div>
        </div>
      ) : null}
      {f.canToggleMemberOf ? <label className="switch"><input type="checkbox" checked={f.showMemberOf} onChange={(e) => set("showMemberOf", e.target.checked)} /><span>{t("editor.show_member_of")}</span></label> : null}
      {f.type === "firm" && f.canApprove ? <label className="switch"><input type="checkbox" checked={f.allowMembers} onChange={(e) => set("allowMembers", e.target.checked)} /><span>{t("editor.allow_members")}</span></label> : null}
      <WordingNotice flags={msg.flags} onSaveAnyway={() => save(true)} />
      {msg.text ? <p className={msg.ok ? "ok-msg" : "err"} role={msg.ok ? "status" : "alert"}>{msg.text}</p> : null}
      <div><button className="btn" type="submit" disabled={busy} aria-busy={busy}>{t("form.save")}</button></div>
    </form>
  );
}
