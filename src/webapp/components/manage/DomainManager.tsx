"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { del, post, type ApiFailure } from "@/lib/client-api";
import { useT } from "@/components/ui/LangProvider";

/** Premium: connect an own domain with a CNAME to {slug}.p.advocateid.in. */
export function DomainManager({ pageId, current, cnameTarget, slug }: { pageId: number; current: { hostname: string; status: string } | null; cnameTarget: string; slug: string }) {
  const t = useT();
  const router = useRouter();
  const [hostname, setHostname] = useState("");
  const [msg, setMsg] = useState<{ error?: string; text?: string }>({});
  return (
    <div className="stack">
      {current ? (
        <section className="card pad stack">
          <h2>{current.hostname} <span className={`pill ${current.status === "active" ? "ok" : current.status === "lapsed" ? "bad" : "wait"}`}>{t(`domain.status.${current.status}`)}</span></h2>
          {current.status === "lapsed" ? <div className="banner warn">{t("domain.lapsed", { slug })}</div> : null}
          {current.status === "pending" ? <div className="banner info">{t("domain.pending")}</div> : null}
          {current.status === "active" ? <div className="banner info">{t("domain.active", { slug })}</div> : null}
          <ol className="steps">
            <li><div><strong>{t("domain.step1")}</strong><p>{t("domain.step1_body")}</p><pre className="share-box" style={{ overflowX: "auto" }}>{current.hostname}  CNAME  {cnameTarget}</pre></div></li>
            <li><div><strong>{t("domain.step2")}</strong><p>{t("domain.step2_body")}</p></div></li>
          </ol>
          <div className="row">
            <button className="btn" onClick={async () => { const r = await post<{ status: string }>(`/api/pages/${pageId}/domain/verify`); setMsg(r.ok ? { text: t(`domain.status.${(r as unknown as { status: string }).status}`) } : { error: (r as ApiFailure).message }); router.refresh(); }}>{t("domain.verify")}</button>
            <button className="btn btn-ghost" onClick={async () => { if (window.confirm(t("domain.confirm_remove"))) { await del(`/api/pages/${pageId}/domain`); router.refresh(); } }}>{t("domain.remove")}</button>
          </div>
          {msg.text ? <p className="ok-msg" role="status">{msg.text}</p> : null}
          {msg.error ? <p className="err" role="alert">{msg.error}</p> : null}
        </section>
      ) : null}
      <section className="card pad stack">
        <h2>{current ? t("domain.change") : t("domain.connect")}</h2>
        <p className="muted">{t("domain.hint")}</p>
        <form className="inline-form" onSubmit={async (e) => {
          e.preventDefault();
          const r = await post(`/api/pages/${pageId}/domain`, { hostname });
          if (r.ok) { setHostname(""); setMsg({}); router.refresh(); } else setMsg({ error: (r as ApiFailure).message });
        }}>
          <div><label className="lbl" htmlFor="dm-host">{t("domain.hostname")}</label><input id="dm-host" value={hostname} onChange={(e) => setHostname(e.target.value)} placeholder="www.example.com" required /></div>
          <button className="btn" type="submit">{t("domain.add")}</button>
        </form>
        {msg.error && !current ? <p className="err" role="alert">{msg.error}</p> : null}
      </section>
    </div>
  );
}
