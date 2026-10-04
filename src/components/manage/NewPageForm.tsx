"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { post, get, type ApiFailure } from "@/lib/client-api";
import { suggestSlug } from "@/lib/slug";
import { useT } from "@/components/ui/LangProvider";
import { TextField } from "./Fields";
import { WordingNotice } from "./WordingNotice";

/** Create a page with the minimum fields (advocate: name, slug, enrolment number, district; firm: name, slug, district). */
export function NewPageForm({ districts }: { districts: { id: number; name: string }[] }) {
  const t = useT();
  const router = useRouter();
  const [type, setType] = useState<"advocate" | "firm">("advocate");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [touched, setTouched] = useState(false);
  const [districtId, setDistrictId] = useState<number>(districts[0]?.id ?? 0);
  const [enrol, setEnrol] = useState("");
  const [slugState, setSlugState] = useState<"" | "ok" | "taken" | "invalid">("");
  const [error, setError] = useState("");
  const [flags, setFlags] = useState<ApiFailure["flags"]>();
  const effectiveSlug = touched ? slug : name ? suggestSlug(name) : "";
  useEffect(() => {
    if (!effectiveSlug) return;
    const h = setTimeout(async () => {
      const r = await get<{ available: boolean; reason: string | null }>(`/api/slug/check?slug=${encodeURIComponent(effectiveSlug)}`);
      if (r.ok) setSlugState((r as unknown as { available: boolean }).available ? "ok" : (r as unknown as { reason: string }).reason === "taken" ? "taken" : "invalid");
    }, 300);
    return () => clearTimeout(h);
  }, [effectiveSlug]);
  const shownSlugState = effectiveSlug ? slugState : "";

  async function submit(ack = false) {
    setError(""); setFlags(undefined);
    const r = await post<{ page: { id: number } }>("/api/pages", { type, name, slug: effectiveSlug, districtId, enrolmentNo: type === "advocate" ? enrol : undefined, acknowledgeWording: ack });
    if (r.ok) { router.push(`/manage/${(r as unknown as { page: { id: number } }).page.id}`); router.refresh(); }
    else if ((r as ApiFailure).flags) setFlags((r as ApiFailure).flags);
    else setError((r as ApiFailure).message ?? (r as ApiFailure).fields?.map((x) => `${x.path}: ${x.message}`).join("; ") ?? t("form.error"));
  }
  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
      <fieldset style={{ border: 0, padding: 0 }}>
        <legend className="lbl">{t("new.type")}</legend>
        <div className="row">
          <label className="switch"><input type="radio" name="type" checked={type === "advocate"} onChange={() => setType("advocate")} /><span>{t("profile.advocate")}</span></label>
          <label className="switch"><input type="radio" name="type" checked={type === "firm"} onChange={() => setType("firm")} /><span>{t("card.firm")}</span></label>
        </div>
      </fieldset>
      <TextField id="np-name" label={t("editor.name")} value={name} onChange={setName} max={120} required hint={t("new.name_hint")} />
      <div>
        <TextField id="np-slug" label={t("new.slug")} value={effectiveSlug} onChange={(v) => { setTouched(true); setSlug(v.toLowerCase()); }} max={30} check={false} required hint={t("new.slug_hint")} />
        {shownSlugState === "ok" ? <p className="ok-msg">{t("new.slug_ok")}</p> : null}
        {shownSlugState === "taken" ? <p className="err">{t("new.slug_taken")}</p> : null}
        {shownSlugState === "invalid" ? <p className="err">{t("new.slug_invalid")}</p> : null}
      </div>
      {type === "advocate" ? <TextField id="np-enrol" label={t("editor.enrolment")} value={enrol} onChange={setEnrol} max={40} check={false} required hint={t("editor.enrolment_hint")} /> : null}
      <div>
        <label className="lbl" htmlFor="np-d">{t("editor.district")}</label>
        <select id="np-d" value={districtId} onChange={(e) => setDistrictId(Number(e.target.value))} required>{districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
      </div>
      <WordingNotice flags={flags} onSaveAnyway={() => submit(true)} />
      {error ? <p className="err" role="alert">{error}</p> : null}
      <button className="btn" type="submit" disabled={shownSlugState !== "ok"}>{t("new.create")}</button>
    </form>
  );
}
