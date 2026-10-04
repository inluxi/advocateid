"use client";
import type { ApiFailure } from "@/lib/client-api";
import { useT } from "@/components/ui/LangProvider";

/** Bar Council wording warning with plain alternatives. The owner may still save (the warning persists and is logged for review). */
export function WordingNotice({ flags, onSaveAnyway }: { flags?: ApiFailure["flags"]; onSaveAnyway?: () => void }) {
  const t = useT();
  if (!flags) return null;
  const list = Object.entries(flags);
  return (
    <div className="wording-flag" role="alert">
      <strong>{t("wording.title")}</strong>
      <ul className="bullets">
        {list.map(([field, found]) => (
          <li key={field}>
            <em>{field}</em>: {found.map((f) => `"${f.phrase}" (${f.suggestion})`).join(", ")}
          </li>
        ))}
      </ul>
      <p style={{ margin: "6px 0" }}>{t("wording.advice")}</p>
      {onSaveAnyway ? <button type="button" className="btn btn-sm btn-ghost" onClick={onSaveAnyway}>{t("wording.save_anyway")}</button> : null}
    </div>
  );
}
