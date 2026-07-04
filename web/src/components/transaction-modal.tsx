"use client";

import { Copy, ExternalLink } from "lucide-react";
import { ActionBadge } from "@/components/action-badge";
import { truncateHash } from "@/lib/utils";

export type TransactionPhase = "review" | "awaiting-signature" | "broadcasting" | "confirmed" | "failed";

type Props = {
  errorMessage?: string;
  hash?: string;
  isOpen: boolean;
  onClose: () => void;
  phase: TransactionPhase;
  summary: Array<{ label: string; value: string }>;
};

export function TransactionModal({ errorMessage, hash, isOpen, onClose, phase, summary }: Props) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(0,0,0,0.6)] px-4 backdrop-blur-sm">
      <div className="panel w-full max-w-2xl rounded-[28px] p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Signature Flow</p>
            <h3 className="mt-2 text-2xl font-medium">Onchain write review</h3>
          </div>
          <ActionBadge kind="sign" />
        </div>

        <div className="mt-6 rounded-[24px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] p-5">
          {phase === "review" ? (
            <div>
              <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Review</p>
              <div className="mt-4 grid gap-3">
                {summary.map((item) => (
                  <div key={item.label} className="rounded-[18px] border border-[var(--line-hairline)] px-4 py-3">
                    <p className="font-mono text-sm uppercase tracking-[0.16em] text-[var(--text-muted)]">{item.label}</p>
                    <p className="mt-2 text-base leading-7 text-[var(--text-primary)]">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {phase === "awaiting-signature" ? (
            <div>
              <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Awaiting Signature</p>
              <p className="mt-4 text-lg">Confirm in your wallet…</p>
            </div>
          ) : null}

          {phase === "broadcasting" ? (
            <div>
              <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Broadcasting</p>
              <p className="mt-4 text-lg">Transaction submitted. Waiting for confirmation…</p>
              <p className="mt-3 font-mono text-base text-[var(--text-muted)]">Confirmations: 02</p>
            </div>
          ) : null}

          {phase === "confirmed" ? (
            <div>
              <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Confirmed</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-[var(--accent-emerald-dim)] bg-[rgba(31,191,143,0.16)] px-3 py-1 font-mono text-sm text-[var(--accent-emerald)]">
                  {truncateHash(hash ?? "")}
                </span>
                <button type="button" className="inline-flex items-center gap-2 text-base text-[var(--text-muted)]">
                  <Copy className="h-4 w-4" />
                  Copy
                </button>
                <a href={hash ? `https://explorer-studio.genlayer.com/tx/${hash}` : "#"} className="inline-flex items-center gap-2 text-base text-[var(--text-muted)]">
                  Explorer
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          ) : null}

          {phase === "failed" ? (
            <div>
              <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Failed</p>
              <p className="mt-4 text-lg">{errorMessage || "Transaction failed. Try again."}</p>
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="rounded-full border border-[var(--line-hairline)] px-5 py-2.5 text-base text-[var(--text-muted)]">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
