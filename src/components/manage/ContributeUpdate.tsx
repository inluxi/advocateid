"use client";
import { useEffect, useState } from "react";
import { get, post, type ApiFailure } from "@/lib/client-api";
import { useT } from "@/components/ui/LangProvider";
import { WordingNotice } from "./WordingNotice";

interface Me {
  authenticated: boolean;
  pages: { id: number; name: string }[];
}

/** Contribute a court update as one of your pages (court and source link are mandatory; published at once with credit). */
export function ContributeUpdate({ courtId }: { courtId: number }) {
  const t = useT();
  const [me, setMe] = useState<Me | null>(null);
  const [pageId, setPageId] = useState<number | null>(null);
  const [f, setF] = useState({ title: "", body: "", sourceUrl: "" });
  const [state, setState] = useState<{ error?: string; ok?: boolean; flags?: ApiFailure["flags"] }>({});
  useEffect(() => {
    get<Me>("/api/auth/me").then((r) => {
      if (r.ok) {
        const m = r as unknown as Me;
        setMe(m);
        if (m.pages[0]) setPageId(m.pages[0].id);
      }
    });
  }, []);
  if (!me) return null;
  if (!me.authenticated) return <p><a href="/login">{t("contribute.login")}</a></p>;
  if (!me.pages.length) return <p><a href="/manage/new">{t("contribute.create_page")}</a></p>;
  const submit = async (ack = false) => {
    const r = await post(`/api/pages/${pageId}/posts?type=court_update`, { ...f, courtId, language: "en", acknowledgeWording: ack });
    if (r.ok) {
      setState({ ok: true });
      setF({ title: "", body: "", sourceUrl: "" });
    } else setState({ error: (r as ApiFailure).message ?? (r as ApiFailure).error, flags: (r as ApiFailure).flags });
  };
  return (
    <form className="card pad stack" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
      {me.pages.length > 1 ? (
        <select aria-label={t("contribute.as")} value={pageId ?? ""} onChange={(e) => setPageId(Number(e.target.value))}>
          {me.pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      ) : null}
      <input type="text" required minLength={3} maxLength={160} placeholder={t("contribute.title")} aria-label={t("contribute.title")} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      <textarea required minLength={10} maxLength={5000} placeholder={t("contribute.body")} aria-label={t("contribute.body")} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
      <input type="url" required placeholder="https://" aria-label={t("contribute.source")} value={f.sourceUrl} onChange={(e) => setF({ ...f, sourceUrl: e.target.value })} />
      <WordingNotice flags={state.flags} onSaveAnyway={() => submit(true)} />
      {state.error && !state.flags ? <p className="err" role="alert">{state.error}</p> : null}
      {state.ok ? <p className="ok-msg" role="status">{t("contribute.done")}</p> : null}
      <button className="btn" type="submit">{t("contribute.publish")}</button>
    </form>
  );
}
