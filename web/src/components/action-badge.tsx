import { clsx } from "clsx";

export function ActionBadge({ kind }: { kind: "sign" | "automated" }) {
  if (kind === "sign") {
    return null;
  }

  return (
    <span
      className={clsx(
        "rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em]",
        "border-[var(--line-hairline)] text-[var(--text-muted)]"
      )}
    >
      AUTOMATED
    </span>
  );
}
