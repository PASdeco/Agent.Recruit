"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, ExternalLink, RefreshCcw, Sparkles, Target, X } from "lucide-react";
import {
  connectWallet,
  getConnectedWalletAddress,
  getFounderDashboardData,
  getProfileById,
  subscribeWalletAddress,
  type FounderDashboardData,
  type OwnedProfile
} from "@/lib/genlayer";
import { truncateHash } from "@/lib/utils";

function CandidateProfileModal({
  errorMessage,
  isLoading,
  onClose,
  profile
}: {
  errorMessage: string;
  isLoading: boolean;
  onClose: () => void;
  profile: OwnedProfile | null;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(2,6,4,0.76)] px-4 py-6">
      <div className="w-full max-w-3xl rounded-[28px] border border-[var(--line-hairline)] bg-[var(--bg-void)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Matched Candidate</p>
            <h2 className="mt-2 text-3xl font-medium">
              {isLoading ? "Loading candidate profile..." : profile?.handle || "Profile unavailable"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line-hairline)] text-[var(--text-muted)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="mt-6 rounded-[22px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] p-5 text-base text-[var(--text-muted)]">
            Fetching the aspirant&apos;s full onchain profile and public contact links...
          </div>
        ) : errorMessage ? (
          <div className="mt-6 rounded-[22px] border border-[rgba(255,120,120,0.25)] bg-[rgba(255,120,120,0.06)] p-5 text-base text-[#ffb3b3]">
            {errorMessage}
          </div>
        ) : profile ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-5">
              <div className="rounded-[22px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-[var(--line-hairline)] px-3 py-1 text-sm text-[var(--text-muted)]">
                    {profile.tier}
                  </span>
                  <span className="rounded-full border border-[var(--line-hairline)] px-3 py-1 text-sm text-[var(--text-muted)]">
                    {profile.reviewStatus}
                  </span>
                  <span className="rounded-full border border-[var(--line-hairline)] px-3 py-1 text-sm text-[var(--text-muted)]">
                    {profile.availability}
                  </span>
                  <span className="rounded-full border border-[var(--line-hairline)] px-3 py-1 text-sm text-[var(--text-muted)]">
                    {profile.location}
                  </span>
                </div>
                <p className="mt-4 text-xl font-medium">{profile.headline}</p>
                <p className="mt-3 text-base leading-8 text-[var(--text-muted)]">{profile.summary}</p>
              </div>

              <div className="rounded-[22px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] p-5">
                <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Skills</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.skills.length ? (
                    profile.skills.map((skill) => (
                      <span key={skill} className="rounded-full border border-[var(--line-hairline)] px-3 py-1.5 text-sm text-[var(--text-muted)]">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-base text-[var(--text-muted)]">No skills listed.</span>
                  )}
                </div>
              </div>

              <div className="rounded-[22px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] p-5">
                <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Role Preferences</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.rolePreferences.length ? (
                    profile.rolePreferences.map((role) => (
                      <span key={role} className="rounded-full border border-[var(--line-hairline)] px-3 py-1.5 text-sm text-[var(--text-muted)]">
                        {role}
                      </span>
                    ))
                  ) : (
                    <span className="text-base text-[var(--text-muted)]">No role preferences listed.</span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-[22px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] p-5">
                <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Public Contact Links</p>
                <div className="mt-4 space-y-3">
                  {[
                    { label: "GitHub", value: profile.githubUrl },
                    { label: "Portfolio", value: profile.portfolioUrl },
                    { label: "LinkedIn", value: profile.linkedinUrl },
                    { label: "Resume", value: profile.resumeUrl }
                  ]
                    .filter((item) => item.value)
                    .map((item) => (
                      <a
                        key={`${item.label}-${item.value}`}
                        href={item.value}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between gap-3 rounded-[18px] border border-[var(--line-hairline)] bg-[rgba(10,14,12,0.55)] px-4 py-4 text-base text-[var(--text-primary)]"
                      >
                        <span>{item.label}</span>
                        <ExternalLink className="h-4 w-4 text-[var(--text-muted)]" />
                      </a>
                    ))}
                  {!(profile.githubUrl || profile.portfolioUrl || profile.linkedinUrl || profile.resumeUrl) ? (
                    <p className="text-base leading-8 text-[var(--text-muted)]">No public direct links were added to this profile.</p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[22px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] p-5">
                <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Socials</p>
                <div className="mt-4 space-y-3">
                  {profile.socials.length ? (
                    profile.socials.map((social) => (
                      <a
                        key={social}
                        href={social}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between gap-3 rounded-[18px] border border-[var(--line-hairline)] bg-[rgba(10,14,12,0.55)] px-4 py-4 text-base text-[var(--text-primary)]"
                      >
                        <span className="truncate">{social}</span>
                        <ExternalLink className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                      </a>
                    ))
                  ) : (
                    <p className="text-base leading-8 text-[var(--text-muted)]">No social links were provided.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-[22px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] p-5 text-base text-[var(--text-muted)]">
            This candidate profile could not be loaded.
          </div>
        )}
      </div>
    </div>
  );
}

export function FounderDashboardPage() {
  const [walletAddress, setWalletAddress] = useState("");
  const [snapshot, setSnapshot] = useState<FounderDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState<OwnedProfile | null>(null);
  const [profileModalError, setProfileModalError] = useState("");
  const [isProfileModalLoading, setIsProfileModalLoading] = useState(false);

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
        const nextSnapshot = await getFounderDashboardData(walletAddress);
        if (isActive) {
          setSnapshot(nextSnapshot);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(error instanceof Error ? error.message : "Could not load your founder dashboard.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
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

  async function openCandidateProfile(profileId: number) {
    setIsProfileModalLoading(true);
    setProfileModalError("");
    setSelectedProfile(null);

    try {
      const profile = await getProfileById(profileId);
      if (!profile) {
        throw new Error("This candidate profile could not be found onchain.");
      }
      setSelectedProfile(profile);
    } catch (error) {
      setProfileModalError(error instanceof Error ? error.message : "Could not load this candidate profile.");
    } finally {
      setIsProfileModalLoading(false);
    }
  }

  const summary = useMemo(() => {
    const opportunities = snapshot?.opportunities ?? [];
    const activeOpportunities = opportunities.filter((opportunity) => opportunity.status === "Active").length;
    const totalMatches = opportunities.reduce((total, opportunity) => total + opportunity.matches.length, 0);
    const filledSlots = opportunities.reduce((total, opportunity) => total + (opportunity.teamDraft?.filledSlots ?? 0), 0);

    return {
      opportunityCount: opportunities.length,
      activeOpportunities,
      totalMatches,
      filledSlots
    };
  }, [snapshot]);

  return (
    <>
      <section className="panel rounded-[30px] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Founder Dashboard</p>
            <h1 className="mt-3 font-[family:var(--font-display)] text-4xl tracking-[-0.05em] sm:text-5xl">
              See every wallet-owned opportunity, every match, and every team draft in one place.
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
              This founder-facing layer looks up opportunities created by the connected wallet and shows the match records and draft-team
              outputs currently orbiting each posting.
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
                <BriefcaseBusiness className="h-4 w-4" />
                {isConnecting ? "Connecting..." : walletAddress ? "Reconnect Wallet" : "Connect Wallet"}
              </button>
              <button
                type="button"
                onClick={() => setRefreshTick((current) => current + 1)}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--line-hairline)] px-4 py-2.5 text-sm text-[var(--text-muted)]"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh view
              </button>
            </div>
            {errorMessage ? <p className="mt-4 text-sm leading-7 text-[#ff9b9b]">{errorMessage}</p> : null}
          </div>
        </div>
      </section>

      {walletAddress ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Opportunities Owned", value: String(summary.opportunityCount) },
              { label: "Active Opportunities", value: String(summary.activeOpportunities) },
              { label: "Match Records", value: String(summary.totalMatches) },
              { label: "Draft Slots Filled", value: String(summary.filledSlots) }
            ].map((item) => (
              <div key={item.label} className="panel rounded-[24px] p-5">
                <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">{item.label}</p>
                <p className="mt-3 text-3xl font-medium">{item.value}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="panel rounded-[28px] p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Owned Opportunities</p>
                  <h2 className="mt-2 text-2xl font-medium">A founder-only view of the hiring pipeline.</h2>
                </div>
                <div className="rounded-full border border-[var(--line-hairline)] px-3 py-1.5 font-mono text-sm text-[var(--text-muted)]">
                  Wallet-scoped
                </div>
              </div>

              {isLoading ? (
                <div className="mt-6 rounded-[22px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] p-5 text-base text-[var(--text-muted)]">
                  Loading your opportunities, their match records, and team drafts...
                </div>
              ) : snapshot?.opportunities.length ? (
                <div className="mt-6 space-y-5">
                  {snapshot.opportunities.map((opportunity) => (
                    <article key={opportunity.opportunityId} className="rounded-[24px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-2xl">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-2xl font-medium">{opportunity.title}</h3>
                            <span className="rounded-full border border-[var(--line-hairline)] px-3 py-1 text-sm text-[var(--text-muted)]">
                              {opportunity.status}
                            </span>
                            <span className="rounded-full border border-[var(--line-hairline)] px-3 py-1 text-sm text-[var(--text-muted)]">
                              {opportunity.seniority}
                            </span>
                          </div>
                          <p className="mt-2 text-lg text-[var(--text-primary)]">{opportunity.mission}</p>
                          <p className="mt-3 text-base leading-8 text-[var(--text-muted)]">{opportunity.summary}</p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {opportunity.requiredSkills.map((skill) => (
                              <span key={skill} className="rounded-full border border-[var(--line-hairline)] px-3 py-1.5 text-sm text-[var(--text-muted)]">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:w-[320px] lg:grid-cols-1">
                          <div className="rounded-[18px] border border-[var(--line-hairline)] bg-[rgba(10,14,12,0.55)] p-4">
                            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Opportunity ID</p>
                            <p className="mt-2 text-lg font-medium">#{opportunity.opportunityId}</p>
                          </div>
                          <div className="rounded-[18px] border border-[var(--line-hairline)] bg-[rgba(10,14,12,0.55)] p-4">
                            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Match records</p>
                            <p className="mt-2 text-lg font-medium">{opportunity.matches.length}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
                        <div className="rounded-[20px] border border-[var(--line-hairline)] bg-[rgba(10,14,12,0.5)] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Incoming matches</p>
                            <Target className="h-4 w-4 text-[var(--accent-emerald)]" />
                          </div>
                          {opportunity.matches.length ? (
                            <div className="mt-4 space-y-3">
                              {opportunity.matches.map((match) => (
                                <div key={match.matchKey} className="rounded-[18px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] p-4">
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                      <p className="text-lg font-medium">{match.profileHandle}</p>
                                      <p className="mt-2 text-base leading-7 text-[var(--text-muted)]">{match.summary}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      <span className="rounded-full border border-[var(--line-hairline)] px-3 py-1.5 font-mono text-sm text-[var(--text-primary)]">
                                        {match.score}% fit
                                      </span>
                                      <span className="rounded-full border border-[var(--line-hairline)] px-3 py-1.5 font-mono text-sm text-[var(--text-muted)]">
                                        {match.band}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => void openCandidateProfile(match.profileId)}
                                        className="rounded-full border border-[var(--accent-emerald-dim)] px-3 py-1.5 font-mono text-sm text-[var(--text-primary)]"
                                      >
                                        View profile
                                      </button>
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
                              No accepted match records exist for this opportunity yet. Once compatible profiles are available, the relayer
                              will write them here.
                            </p>
                          )}
                        </div>

                        <div className="rounded-[20px] border border-[var(--line-hairline)] bg-[rgba(10,14,12,0.5)] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Draft team</p>
                            <Sparkles className="h-4 w-4 text-[var(--accent-emerald)]" />
                          </div>
                          {opportunity.teamDraft?.assignments.length ? (
                            <div className="mt-4 space-y-3">
                              {opportunity.teamDraft.assignments.map((assignment) => (
                                <div key={assignment.slotKey} className="rounded-[18px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] p-4">
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <p className="font-medium">{assignment.role}</p>
                                      <p className="mt-1 text-base text-[var(--text-muted)]">
                                        {assignment.profileHandle || "Waiting for a qualified profile"}
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap justify-end gap-2">
                                      <div className="rounded-full border border-[var(--line-hairline)] px-3 py-1.5 font-mono text-sm text-[var(--text-muted)]">
                                        {assignment.status === "Matched" ? `${assignment.score}% fit` : "Open"}
                                      </div>
                                      {assignment.profileId ? (
                                        <button
                                          type="button"
                                          onClick={() => void openCandidateProfile(assignment.profileId)}
                                          className="rounded-full border border-[var(--accent-emerald-dim)] px-3 py-1.5 font-mono text-sm text-[var(--text-primary)]"
                                        >
                                          View profile
                                        </button>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-4 text-base leading-8 text-[var(--text-muted)]">
                              No team draft has been generated for this opportunity yet. Team formation will appear here after enough match
                              records exist.
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-[22px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] p-5 text-base leading-8 text-[var(--text-muted)]">
                  This wallet does not own any onchain opportunity yet. Post one from the opportunities workspace and this dashboard will
                  start tracking its matches and team drafts automatically.
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="panel rounded-[28px] p-6 sm:p-8">
                <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Founder signal</p>
                <h2 className="mt-2 text-2xl font-medium">What this view gives you now.</h2>
                <div className="mt-5 space-y-3">
                  {[
                    "Every opportunity created by this wallet is grouped together.",
                    "Each opportunity shows its current accepted match records.",
                    "Draft-team output is shown alongside the originating opportunity instead of floating as a network-only artifact."
                  ].map((item) => (
                    <div key={item} className="rounded-[18px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] px-4 py-4 text-base text-[var(--text-muted)]">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel rounded-[28px] p-6 sm:p-8">
                <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Public plus private</p>
                <h2 className="mt-2 text-2xl font-medium">The network feed remains visible.</h2>
                <p className="mt-4 text-base leading-8 text-[var(--text-muted)]">
                  Match activity can still appear publicly, but founders now have a direct way to see what belongs to their own wallet
                  without filtering the whole network mentally.
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
            <h2 className="mt-2 text-3xl font-medium">Connect the founder wallet to unlock the founder dashboard.</h2>
            <p className="mt-4 text-base leading-8 text-[var(--text-muted)]">
              Once connected, this page will find every opportunity created by that wallet and show the current match and draft-team
              activity surrounding it.
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

      {(isProfileModalLoading || selectedProfile || profileModalError) ? (
        <CandidateProfileModal
          errorMessage={profileModalError}
          isLoading={isProfileModalLoading}
          onClose={() => {
            setIsProfileModalLoading(false);
            setSelectedProfile(null);
            setProfileModalError("");
          }}
          profile={selectedProfile}
        />
      ) : null}
    </>
  );
}
