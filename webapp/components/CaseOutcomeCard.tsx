import { FilledBadge } from "@/components/Badge";
import type { OutcomeTag } from "@prisma/client";

const outcomeLabels: Record<OutcomeTag, string> = {
  favorable: "Favourable",
  unfavorable: "Unfavourable",
  settled: "Settled",
  pending: "Pending",
};

export function CaseOutcomeCard({
  title,
  outcomeTag,
  summary,
  categoryName,
  institutionName,
}: {
  title: string;
  outcomeTag: OutcomeTag;
  summary: string;
  categoryName?: string;
  institutionName?: string;
}) {
  return (
    <div className="border-t-[3px] border-brand bg-white p-4 shadow-sm">
      <p className="text-h3 text-ink">{title}</p>
      <p className="mt-2 text-body text-ink-800">{summary}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {categoryName ? (
          <span className="border border-brand bg-ink-100 px-[9px] py-[5px] text-small font-medium text-brand-ink">
            {categoryName}
          </span>
        ) : null}
        <FilledBadge>{outcomeLabels[outcomeTag]}</FilledBadge>
        {institutionName ? <span className="text-small text-ink-700">{institutionName}</span> : null}
      </div>
    </div>
  );
}
