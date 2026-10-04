import type { ReactNode } from "react";

/**
 * CSS-only tab bar (no client component needed — see the .tabset rules in
 * app/globals.css). Matches the mockups' tab bars: Free tier's
 * Profile/Posts, Premium tier's Overview/Posts/Reviews/Offices.
 */
export function Tabs({ id, tabs }: { id: string; tabs: { label: string; content: ReactNode }[] }) {
  return (
    <div className="tabset relative">
      {tabs.map((t, i) => (
        <input
          key={t.label}
          type="radio"
          name={`${id}-tab`}
          id={`${id}-tab-${i}`}
          defaultChecked={i === 0}
        />
      ))}
      <div className="tab-bar flex overflow-x-auto border-b-2 border-brand bg-white">
        {tabs.map((t, i) => (
          <label
            key={t.label}
            htmlFor={`${id}-tab-${i}`}
            className="whitespace-nowrap px-4 py-3.5 text-small font-bold uppercase tracking-[0.1em] text-ink-700"
          >
            {t.label}
          </label>
        ))}
      </div>
      <div className="tab-panels">
        {tabs.map((t) => (
          <div key={t.label} className="tab-panel">
            {t.content}
          </div>
        ))}
      </div>
    </div>
  );
}
