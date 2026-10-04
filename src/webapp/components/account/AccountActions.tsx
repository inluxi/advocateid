"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { post } from "@/lib/client-api";
import { useT } from "@/components/ui/LangProvider";

export function ActingSwitcher({ pages, current }: { pages: { id: number; name: string }[]; current: number | null }) {
  const t = useT();
  const router = useRouter();
  if (pages.length < 2) return null;
  return (
    <div className="page-switch">
      <label className="lbl" htmlFor="acting" style={{ margin: 0 }}>{t("account.acting_as")}</label>
      <select id="acting" defaultValue={current ?? ""} onChange={async (e) => { await post("/api/auth/acting", { pageId: e.target.value ? Number(e.target.value) : null }); router.refresh(); }}>
        <option value="">{t("account.acting_none")}</option>
        {pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
    </div>
  );
}

export function MembershipActions({ id, kind }: { id: number; kind: "request" | "invite" }) {
  const t = useT();
  const router = useRouter();
  const [err, setErr] = useState("");
  const act = async (action: "approve" | "reject") => {
    const r = await post(`/api/memberships/${id}`, { action });
    if (r.ok) router.refresh();
    else setErr((r as { message?: string }).message ?? t("form.error"));
  };
  return (
    <span className="row">
      <button className="btn btn-sm" onClick={() => act("approve")}>{kind === "request" ? t("assoc.approve") : t("assoc.accept")}</button>
      <button className="btn btn-sm btn-ghost" onClick={() => act("reject")}>{t("assoc.reject")}</button>
      {err ? <span className="err">{err}</span> : null}
    </span>
  );
}

export function LogoutButton() {
  const t = useT();
  const router = useRouter();
  return (
    <button className="btn btn-outline btn-sm" onClick={async () => { await post("/api/auth/logout"); router.push("/"); router.refresh(); }}>
      {t("account.logout")}
    </button>
  );
}

export function DeleteAccount() {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  return (
    <div>
      {!open ? <button className="btn btn-ghost" onClick={() => setOpen(true)}>{t("settings.delete")}</button> : (
        <div className="upgrade-lock stack" role="alertdialog" aria-labelledby="del-h">
          <h3 id="del-h">{t("settings.delete_title")}</h3>
          <p>{t("settings.delete_body")}</p>
          <label className="lbl" htmlFor="del-c">{t("settings.delete_type")}</label>
          <input id="del-c" value={text} onChange={(e) => setText(e.target.value)} />
          {err ? <p className="err">{err}</p> : null}
          <div className="row">
            <button className="btn" disabled={text.trim().toUpperCase() !== "DELETE"} onClick={async () => {
              const r = await post("/api/account/delete", { confirm: true });
              if (r.ok) { router.push("/"); router.refresh(); } else setErr(t("form.error"));
            }}>{t("settings.delete_confirm")}</button>
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>{t("form.cancel")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
