"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { clearStoredWalletAddress, connectWallet, getConnectedWalletAddress } from "@/lib/genlayer";
import { truncateHash } from "@/lib/utils";

export function WalletChip() {
  const [address, setAddress] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");

  useEffect(() => {
    let isActive = true;

    void getConnectedWalletAddress().then((nextAddress) => {
      if (isActive) {
        setAddress(nextAddress);
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  async function connect() {
    setIsConnecting(true);
    setConnectError("");
    try {
      const wallet = await connectWallet();
      setAddress(wallet.address);
    } catch (error) {
      setConnectError(error instanceof Error ? error.message : "Wallet connection failed.");
    } finally {
      setIsConnecting(false);
    }
  }

  function disconnect() {
    setAddress("");
    setConnectError("");
    clearStoredWalletAddress();
  }

  if (!address) {
    return (
      <button
        type="button"
        onClick={connect}
        disabled={isConnecting}
        className="rounded-full border border-[var(--accent-emerald-dim)] px-4 py-2.5 text-base text-[var(--text-primary)] hover:bg-[rgba(31,191,143,0.12)]"
        title={connectError || "Connect wallet"}
      >
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={disconnect}
      className="inline-flex items-center gap-2 rounded-full border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] px-4 py-2"
    >
      <span className="h-6 w-6 rounded-full bg-[rgba(31,191,143,0.18)]" />
      <span className="font-mono text-base text-[var(--text-primary)]">{truncateHash(address)}</span>
      <span className="rounded-full border border-[var(--line-hairline)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
        studionet
      </span>
      <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
    </button>
  );
}
