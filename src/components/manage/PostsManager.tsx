"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { del, get, post, put, csrfToken, type ApiFailure } from "@/lib/client-api";
import { uploadImage, type UploadStatus } from "@/lib/image-client";
import { useT } from "@/components/ui/LangProvider";
import { Icon } from "@/components/Icon";
import { MAX_POST_CATEGORIES, POST_BODY_MAX, UPDATE_BODY_MAX } from "@/lib/entitlements";
import { CourtPicker, TextField, type CourtOption } from "./Fields";
import { WordingNotice } from "./WordingNotice";

export interface PostRow { id: number; title: string; type: "article" | "court_update"; status: string; date: string; suspendedReason: string | null }

interface Draft {
  id?: number;
  type: "article" | "court_update";
  title: string;
  body: string;
  language: "en" | "ml";
  categoryIds: number[];
  court: CourtOption | null;
  sourceUrl: string;
  coverImageKey: string | null;
}

const blank = (type: Draft["type"]): Draft => ({ type, title: "", body: "", language: "en", categoryIds: [], court: null, sourceUrl: "", coverImageKey: null });

/** Posts (articles) and court-update contributions. Wording is checked live and again on publish. */
export function PostsManager({ pageId, posts, categories }: { pageId: number; posts: PostRow[]; categories: { id: number; name: string }[] }) {
  const t = useT();
  const router = useRouter();
  const [d, setD] = useState<Draft | null>(null);
  const [state, setState] = useState<{ error?: string; flags?: ApiFailure["flags"] }>({});
  const [cover, setCover] = useState<UploadStatus>({ state: "idle" });
  const isUpdate = d?.type === "court_update";

  async function open(p: PostRow) {
    const r = await get<{ post: any; categoryIds: number[] }>(`/api/posts/${p.id}`);
    if (!r.ok) return;
    const { post: x, categoryIds } = r as unknown as { post: any; categoryIds: number[] };
    let court: CourtOption | null = null;
    if (x.courtId) {
      const c = await get<{ courts: CourtOption[] }>(`/api/courts?q=`);
      court = (c as any).courts?.find((k: CourtOption) => k.id === x.courtId) ?? { id: x.courtId, name: `#${x.courtId}` };
    }
    setD({ id: x.id, type: x.type, title: x.title, body: x.body, language: x.language, categoryIds, court, sourceUrl: x.sourceUrl ?? "", coverImageKey: x.coverImageKey ?? null });
  }

  async function save(ack = false) {
    if (!d) return;
    setState({});
    const body = isUpdate
      ? { title: d.title, body: d.body, courtId: d.court?.id, sourceUrl: d.sourceUrl, language: d.language, acknowledgeWording: ack }
      : { title: d.title, body: d.body, language: d.language, categoryIds: d.categoryIds, courtId: d.court?.id ?? null, sourceUrl: d.sourceUrl || null, coverImageKey: d.coverImageKey, acknowledgeWording: ack };
    const r = d.id ? await put(`/api/posts/${d.id}`, body) : await post(`/api/pages/${pageId}/posts${isUpdate ? "?type=court_update" : ""}`, body);
    if (r.ok) { setD(null); router.refresh(); } else setState({ error: (r as ApiFailure).flags ? undefined : (r as ApiFailure).message ?? (r as ApiFailure).fields?.map((x) => `${x.path}: ${x.message}`).join("; ") ?? t("form.error"), flags: (r as ApiFailure).flags });
  }

  return (
    <div className="stack">
      <div className="row">
        <button className="btn btn-sm" onClick={() => setD(blank("article"))}><Icon name="plus" size="sm" />{t("posts.new_article")}</button>
        <button className="btn btn-sm btn-outline" onClick={() => setD(blank("court_update"))}><Icon name="plus" size="sm" />{t("posts.new_update")}</button>
      </div>
      <ul className="reorder">
        {posts.map((p) => (
          <li key={p.id}>
            <span className="t"><strong>{p.title}</strong> <span className="muted">· {t(p.type === "article" ? "posts.type.article" : "posts.type.update")} · {p.date}</span>
              {p.status !== "published" ? <span className="pill bad" style={{ marginLeft: 8 }}>{t("posts.suspended")}</span> : null}</span>
            <button className="icon-btn" aria-label={t("list.edit")} onClick={() => void open(p)}><Icon name="edit" size="sm" /></button>
            <button className="icon-btn" aria-label={t("list.remove")} onClick={async () => { if (window.confirm(t("list.confirm_remove"))) { await del(`/api/posts/${p.id}`); router.refresh(); } }}><Icon name="trash" size="sm" /></button>
          </li>
        ))}
        {posts.length === 0 ? <li className="muted">{t("list.empty")}</li> : null}
      </ul>

      {d ? (
        <form className="card pad stack" onSubmit={(e) => { e.preventDefault(); void save(); }}>
          <h2>{d.id ? t("list.edit") : t(isUpdate ? "posts.new_update" : "posts.new_article")}</h2>
          <TextField id="po-title" label={t("contribute.title")} value={d.title} onChange={(v) => setD({ ...d, title: v })} max={160} required />
          <TextField id="po-body" label={t("posts.body")} value={d.body} onChange={(v) => setD({ ...d, body: v })} max={isUpdate ? UPDATE_BODY_MAX : POST_BODY_MAX} textarea rows={12} required hint={t(isUpdate ? "posts.update_hint" : "posts.body_hint")} />
          <div className="form-row two">
            <div><label className="lbl" htmlFor="po-lang">{t("editor.language")}</label>
              <select id="po-lang" value={d.language} onChange={(e) => setD({ ...d, language: e.target.value as "en" | "ml" })}><option value="en">English</option><option value="ml">Malayalam</option></select></div>
            <TextField id="po-src" label={t(isUpdate ? "contribute.source" : "posts.source")} type="url" value={d.sourceUrl} onChange={(v) => setD({ ...d, sourceUrl: v })} check={false} required={isUpdate} />
          </div>
          <CourtPicker label={t(isUpdate ? "posts.court_required" : "posts.court_optional")} value={d.court} onChange={(c) => setD({ ...d, court: c })} />
          {!isUpdate ? (
            <>
              <fieldset style={{ border: 0, padding: 0 }}>
                <legend className="lbl">{t("posts.categories", { n: MAX_POST_CATEGORIES })}</legend>
                <div className="chips">
                  {categories.map((c) => {
                    const on = d.categoryIds.includes(c.id);
                    return <label key={c.id} className={`chip ${on ? "sel" : ""}`}><input type="checkbox" className="sr-only" checked={on} disabled={!on && d.categoryIds.length >= MAX_POST_CATEGORIES} onChange={() => setD({ ...d, categoryIds: on ? d.categoryIds.filter((x) => x !== c.id) : [...d.categoryIds, c.id] })} />{c.name}</label>;
                  })}
                </div>
              </fieldset>
              <div>
                <label className="lbl" htmlFor="po-cover">{t("posts.cover")}</label>
                <input id="po-cover" type="file" accept="image/jpeg,image/png,image/webp" onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  await uploadImage({ pageId, kind: "cover", file: f, csrf: (await csrfToken()) ?? "", onStatus: (s) => { setCover(s); if (s.state === "done") setD((x) => (x ? { ...x, coverImageKey: s.key } : x)); } });
                }} />
                {cover.state === "uploading" ? <div className="meter"><i style={{ width: `${cover.pct}%` }} /></div> : null}
                {cover.state === "done" || d.coverImageKey ? <p className="ok-msg">{t("image.done")}</p> : null}
              </div>
            </>
          ) : null}
          <WordingNotice flags={state.flags} onSaveAnyway={() => save(true)} />
          {state.error ? <p className="err" role="alert">{state.error}</p> : null}
          <div className="row"><button className="btn" type="submit">{t("posts.publish")}</button><button className="btn btn-ghost" type="button" onClick={() => { setD(null); setState({}); }}>{t("form.cancel")}</button></div>
        </form>
      ) : null}
    </div>
  );
}
