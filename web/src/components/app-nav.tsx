"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { WalletChip } from "@/components/wallet-chip";

const links = [
  { href: "/app/personal", label: "Personal" },
  { href: "/app/founder", label: "Founder" },
  { href: "/app/talent", label: "Talent" },
  { href: "/app/opportunities", label: "Opportunities" },
  { href: "/app/matching", label: "Matching" },
  { href: "/app/teams", label: "Teams" }
];

export function AppNav({ showLinks = true }: { showLinks?: boolean }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="glass mx-auto flex max-w-7xl items-center justify-between rounded-full border border-[var(--line-hairline)] px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="status-dot h-2.5 w-2.5 rounded-full bg-[var(--accent-emerald)]" />
          <div>
            <p className="font-[family:var(--font-display)] text-xl tracking-[-0.03em]">Agent.Recruit</p>
            <p className="text-sm text-[var(--text-muted)]">Consensus-native talent accelerator</p>
          </div>
        </Link>
        {showLinks ? (
          <nav className="hidden items-center gap-2 lg:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "rounded-full px-4 py-2.5 text-base",
                  pathname.startsWith(link.href)
                    ? "bg-[rgba(31,191,143,0.16)] text-[var(--text-primary)]"
                    : "text-[var(--text-muted)]"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        ) : null}
        <WalletChip />
      </div>
    </header>
  );
}
