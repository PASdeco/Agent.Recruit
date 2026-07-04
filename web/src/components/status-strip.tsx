import { clsx } from "clsx";

const stages = ["Submitted", "Evaluating", "Matches Ready"] as const;

export function StatusStrip({
  current
}: {
  current: (typeof stages)[number];
}) {
  const currentIndex = stages.indexOf(current);

  return (
    <div className="rounded-full border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
      <div className="flex flex-wrap items-center gap-3 text-sm uppercase tracking-[0.18em]">
        {stages.map((stage, index) => (
          <div key={stage} className="flex items-center gap-3">
            <span
              className={clsx(
                "h-2.5 w-2.5 rounded-full",
                index <= currentIndex ? "bg-[var(--accent-emerald)]" : "bg-[rgba(255,255,255,0.15)]"
              )}
            />
            <span className={index <= currentIndex ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}>{stage}</span>
            {index < stages.length - 1 ? <span className="text-[var(--text-muted)]">→</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
