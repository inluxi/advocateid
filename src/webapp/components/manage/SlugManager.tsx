"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { get, post, type ApiFailure } from "@/lib/client-api";
import { useT } from "@/components/ui/LangProvider";
import { TextField } from "./Fields";

export function SlugManager({ pageId, slug, blockedUntil }: { pageId: number; slug: string; blockedUntil: string | null }) {
  const t = useT();
  const router = useRouter();
  const [value, setValue] = useState(slug);
  const [state, setState] = useState<"" | "ok" | "taken" | "invalid">("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (value === slug || !value) return;
    const h = setTimeout(async () => {
      const r = await get<{ available: boolean; reason: string | null }>(`/api/slug/check?slug=${encodeURIComponent(value)}&except=${pageId}`);
      if (r.ok) setState((r as unknown as { available: boolean }).available ? "ok" : (r as unknown as { reason: string }).reason === "taken" ? "taken" : "invalid");
    }, 300);
    return () => clearTimeout(h);
  }, [value, slug, pageId]);
  const shown = value === slug || !value ? "" : state;
  const blocked = !!blockedUntil;
  return (
    <form className="card pad stack" onSubmit={async (e) => {
      e.preventDefault();
      if (!window.confirm(t("slug.confirm"))) return;
      const r = await post(`/api/pages/${pageId}/slug`, { slug: value });
      if (r.ok) { setError(""); router.refresh(); } else setError((r as ApiFailure).message ?? t("form.error"));
    }}>
      {blocked ? <div className="banner warn">{t("slug.cooldown", { date: blockedUntil! })}</div> : null}
      <TextField id="sl-slug" label={t("new.slug")} value={value} onChange={(v) => setValue(v.toLowerCase())} max={30} check={false} hint={t("new.slug_hint")} />
      {shown === "ok" ? <p className="ok-msg">{t("new.slug_ok")}</p> : null}
      {shown === "taken" ? <p className="err">{t("new.slug_taken")}</p> : null}
      {shown === "invalid" ? <p className="err">{t("new.slug_invalid")}</p> : null}
      {error ? <p className="err" role="alert">{error}</p> : null}
      <div><button className="btn" type="submit" disabled={blocked || shown !== "ok"}>{t("slug.change")}</button></div>
    </form>
  );
}
