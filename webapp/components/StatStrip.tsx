/** Cells share 1px gaps on an ink-filled parent, producing a true hairline grid with no double borders. */
export function StatStrip({ stats }: { stats: { label: string; value: string | number }[] }) {
  return (
    <div className="grid grid-cols-2 gap-px bg-ink md:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-bg p-4">
          <p className="text-h2 tabular-nums text-ink">{s.value}</p>
          <p className="mt-1 text-small text-ink-700">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
