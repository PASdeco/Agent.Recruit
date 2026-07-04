import { clsx } from "clsx";

export function ConsensusPulse({ className }: { className?: string }) {
  return (
    <div className={clsx("relative h-24 w-40 overflow-hidden rounded-[20px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)]", className)}>
      <div className="pulse-dots absolute inset-0" />
      <div className="absolute inset-x-4 bottom-6 h-12 rounded-full bg-[radial-gradient(circle,rgba(31,191,143,0.35),transparent_66%)] blur-xl" />
    </div>
  );
}
