"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, RefreshCcw, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import {
  connectWallet,
  getConnectedWalletAddress,
  getPersonalDashboardData,
  syncAutomation,
  subscribeWalletAddress,
  type MatchRecord,
  type PersonalDashboardData
} from "@/lib/genlayer";
import { truncateHash } from "@/lib/utils";

function sortProfileMatches(matches: MatchRecord[]) {
  return [...matches].sort((left, right) => {
    const syncDelta = right.syncedAt - left.syncedAt;
    if (syncDelta !== 0) {
      return syncDelta;
    }
    return right.score - left.score;
  });
}

export function PersonalDashboardPage() {
  const [walletAddress, setWalletAddress] = useState("");
  const [snapshot, setSnapshot] = useState<PersonalDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let isActive = true;

    void getConnectedWalletAddress().then((nextAddress) => {
      if (isActive) {
        setWalletAddress(nextAddress);
      }
    });

    const unsubscribe = subscribeWalletAddress((nextAddress) => {
      if (isActive) {
        setWalletAddress(nextAddress);
      }
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    async function load() {
      if (!walletAddress) {
        setSnapshot(null);
        setIsLoading(false);
        setErrorMessage("");
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const nextSnapshot = await getPersonalDashboardData(walletAddress);
        if (isActive) {
          setSnapshot(nextSnapshot);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(error instanceof Error ? error.message : "Could not load your dashboard.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }

      if (!isActive) {
        return;
      }

      setIsSyncing(true);

      try {
        const automationResults = await syncAutomation(4, 1200, walletAddress);
        const latestResult = automationResults[automationResults.length - 1];
        if (latestResult?.status === "disabled") {
          return;
        }

        const refreshedSnapshot = await getPersonalDashboardData(walletAddress);
        if (isActive) {
          setSnapshot(refreshedSnapshot);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(error instanceof Error ? error.message : "Automation could not refresh your dashboard.");
        }
      } finally {
        if (isActive) {
          setIsSyncing(false);
        }
      }
    }

    void load();

    return () => {
      isActive = false;
    };
  }, [walletAddress, refreshTick]);

  async function connectDashboardWallet() {
    setIsConnecting(true);
    setErrorMessage("");

    try {
      const wallet = await connectWallet();
      setWalletAddress(wallet.address);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Wallet connection failed.");
    } finally {
      setIsConnecting(false);
    }
  }

  const summary = useMemo(() => {
    const profiles = snapshot?.profiles ?? [];
    const allMatches = profiles.flatMap((profile) => profile.matches);
    const strongestMatch = [...allMatches].sort((left, right) => right.score - left.score)[0] ?? null;
    const reviewedProfiles = profiles.filter((profile) => profile.reviewStatus === "Matches Ready").length;

    return {
      profileCount: profiles.length,
      reviewedProfiles,
      totalMatches: allMatches.length,
      strongestMatch
    };
  }, [snapshot]);

  return (
    <>
      <section className="panel rounded-[30px] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Personal Dashboard</p>
            <h1 className="mt-3 font-[family:var(--font-display)] text-4xl tracking-[-0.05em] sm:text-5xl">
              Watch your wallet-owned talent profile and every match around it.
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
              This view is private to the connected wallet context. It finds the profiles owned by your address, tracks review status,
              and shows the opportunities your profile has already matched against onchain.
            </p>
          </div>
          <div className="min-w-[280px] rounded-[24px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] p-5">
            <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Wallet context</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="status-dot h-2.5 w-2.5 rounded-full bg-[var(--accent-emerald)]" />
              <span className="font-mono text-sm text-[var(--text-primary)]">
                {walletAddress ? truncateHash(walletAddress) : "No wallet connected"}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={connectDashboardWallet}
                disabled={isConnecting}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-emerald)] px-4 py-2.5 text-sm font-semibold text-[var(--bg-void)]"
              >
                <UserRound className="h-4 w-4" />
                {isConnecting ? "Connecting..." : walletAddress ? "Reconnect Wallet" : "Connect Wallet"}
              </button>
              <button
                type="button"
                onClick={() => setRefreshTick((current) => current + 1)}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--line-hairline)] px-4 py-2.5 text-sm text-[var(--text-muted)]"
              >
                <RefreshCcw className="h-4 w-4" />
                {isSyncing ? "Refreshing..." : "Refresh view"}
              </button>
            </div>
            {isSyncing ? (
              <p className="mt-4 text-sm leading-7 text-[var(--text-muted)]">
                Automation is reconciling profile review and match records onchain...
              </p>
            ) : null}
            {errorMessage ? <p className="mt-4 text-sm leading-7 text-[#ff9b9b]">{errorMessage}</p> : null}
          </div>
        </div>
      </section>

      {walletAddress ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Profiles Owned", value: String(summary.profileCount) },
              { label: "Profiles Reviewed", value: String(summary.reviewedProfiles) },
              { label: "Total Match Records", value: String(summary.totalMatches) },
              { label: "Strongest Fit", value: summary.strongestMatch ? `${summary.strongestMatch.score}%` : "No match yet" }
            ].map((item) => (
              <div key={item.label} className="panel rounded-[24px] p-5">
                <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">{item.label}</p>
                <p className="mt-3 text-3xl font-medium">{item.value}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="panel rounded-[28px] p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Owned Profiles</p>
                  <h2 className="mt-2 text-2xl font-medium">Everything happening around your talent identity.</h2>
                </div>
                <div className="rounded-full border border-[var(--line-hairline)] px-3 py-1.5 font-mono text-sm text-[var(--text-muted)]">
                  Wallet-scoped
                </div>
              </div>

              {isLoading ? (
                <div className="mt-6 rounded-[22px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] p-5 text-base text-[var(--text-muted)]">
                  Loading your profiles and matches from Studionet...
                </div>
              ) : snapshot?.profiles.length ? (
                <div className="mt-6 space-y-5">
                  {snapshot.profiles.map((profile) => (
                    <article key={profile.profileId} className="rounded-[24px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-2xl">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-2xl font-medium">{profile.handle}</h3>
                            <span className="rounded-full border border-[var(--line-hairline)] px-3 py-1 text-sm text-[var(--text-muted)]">
                              {profile.tier}
                            </span>
                            <span className="rounded-full border border-[var(--line-hairline)] px-3 py-1 text-sm text-[var(--text-muted)]">
                              {profile.reviewStatus}
                            </span>
                          </div>
                          <p className="mt-2 text-lg text-[var(--text-primary)]">{profile.headline}</p>
                          <p className="mt-3 text-base leading-8 text-[var(--text-muted)]">{profile.summary}</p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {profile.skills.length ? (
                              profile.skills.map((skill) => (
                                <span key={skill} className="rounded-full border border-[var(--line-hairline)] px-3 py-1.5 text-sm text-[var(--text-muted)]">
                                  {skill}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-[var(--text-muted)]">No skills listed yet.</span>
                            )}
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:w-[320px] lg:grid-cols-1">
                          <div className="rounded-[18px] border border-[var(--line-hairline)] bg-[rgba(10,14,12,0.55)] p-4">
                            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Profile ID</p>
                            <p className="mt-2 text-lg font-medium">#{profile.profileId}</p>
                          </div>
                          <div className="rounded-[18px] border border-[var(--line-hairline)] bg-[rgba(10,14,12,0.55)] p-4">
                            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Matches found</p>
                            <p className="mt-2 text-lg font-medium">{profile.matches.length}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 rounded-[20px] border border-[var(--line-hairline)] bg-[rgba(10,14,12,0.5)] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Your opportunity matches</p>
                          <div className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)]">
                            <ShieldCheck className="h-4 w-4 text-[var(--accent-emerald)]" />
                            Consensus outcomes only
                          </div>
                        </div>

                        {profile.matches.length ? (
                          <div className="mt-4 space-y-3">
                            {sortProfileMatches(profile.matches).map((match) => (
                              <div key={match.matchKey} className="rounded-[18px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <p className="text-lg font-medium">{match.opportunityTitle}</p>
                                    <p className="mt-2 text-base leading-7 text-[var(--text-muted)]">{match.summary}</p>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <span className="rounded-full border border-[var(--line-hairline)] px-3 py-1.5 font-mono text-sm text-[var(--text-primary)]">
                                      {match.score}% fit
                                    </span>
                                    <span className="rounded-full border border-[var(--line-hairline)] px-3 py-1.5 font-mono text-sm text-[var(--text-muted)]">
                                      {match.band}
                                    </span>
                                  </div>
                                </div>
                                <p className="mt-3 font-mono text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                                  Match sync #{match.syncedAt}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-4 text-base leading-8 text-[var(--text-muted)]">
                            No opportunity has matched this profile yet. Once a compatible opportunity exists, the relayer will submit a
                            pair evaluation and it will appear here automatically.
                          </p>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-[22px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] p-5 text-base leading-8 text-[var(--text-muted)]">
                  This wallet does not own any onchain profile yet. Create one from the talent workspace and this dashboard will start
                  tracking its review and matches automatically.
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="panel rounded-[28px] p-6 sm:p-8">
                <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">What changes here</p>
                <h2 className="mt-2 text-2xl font-medium">Signals tied directly to your wallet.</h2>
                <div className="mt-5 space-y-3">
                  {[
                    "Profiles created by this wallet appear here first.",
                    "Consensus-reviewed tier updates stay attached to the owned profile.",
                    "Every accepted match for those profiles is listed here even while public activity continues elsewhere."
                  ].map((item) => (
                    <div key={item} className="rounded-[18px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] px-4 py-4 text-base text-[var(--text-muted)]">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel rounded-[28px] p-6 sm:p-8">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Network view</p>
                    <h2 className="mt-2 text-2xl font-medium">Public feed still matters.</h2>
                  </div>
                  <Sparkles className="h-5 w-5 text-[var(--accent-emerald)]" />
                </div>
                <p className="mt-4 text-base leading-8 text-[var(--text-muted)]">
                  Your private wallet dashboard does not replace the public network story. It simply gives the aspirant a direct place to
                  see owned profiles and their matches without hunting through the global feed.
                </p>
                <Link href="/" className="mt-5 inline-flex items-center gap-2 text-base text-[var(--text-muted)]">
                  Return to network overview
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className="panel rounded-[28px] p-6 sm:p-8">
          <div className="max-w-2xl">
            <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Wallet required</p>
            <h2 className="mt-2 text-3xl font-medium">Connect the aspirant wallet to unlock the personal dashboard.</h2>
            <p className="mt-4 text-base leading-8 text-[var(--text-muted)]">
              Once connected, this page will find every profile owned by that wallet and show the exact match activity linked to it.
            </p>
            <button
              type="button"
              onClick={connectDashboardWallet}
              disabled={isConnecting}
              className="mt-6 inline-flex items-center gap-3 rounded-full bg-[var(--accent-emerald)] px-5 py-3.5 text-base font-semibold text-[var(--bg-void)]"
            >
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
          </div>
        </section>
      )}
    </>
  );
}
