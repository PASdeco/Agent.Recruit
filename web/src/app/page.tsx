import Link from "next/link";
import { ArrowUpRight, CheckCircle2, ShieldCheck, Sparkles, Waves } from "lucide-react";
import { ActionBadge } from "@/components/action-badge";
import { AppNav } from "@/components/app-nav";
import { ConsensusPulse } from "@/components/consensus-pulse";
import { RecentActivityTicker } from "@/components/recent-activity-ticker";
import { StatusStrip } from "@/components/status-strip";
import { getNetworkSnapshot } from "@/lib/live-data";

const talentCards = [
  {
    title: "Basic",
    copy: "Start with your essentials and register your onchain talent identity.",
    features: ["Wallet ownership", "Headline and role preferences", "Initial evidence links"]
  },
  {
    title: "Verified",
    copy: "Add stronger evidence so the network can validate real execution signals.",
    features: ["GitHub + portfolio proof", "Expanded skills evidence", "Consensus-reviewed tier"]
  },
  {
    title: "Elite Builder",
    copy: "Signal top-tier execution for founders assembling serious onchain teams.",
    features: ["Deep proof stack", "Stronger fit visibility", "Priority in draft generation"]
  }
];

export const dynamic = "force-dynamic";

function formatActivityMarker(timestamp: number) {
  return `Sync #${timestamp}`;
}

export default async function Home() {
  const snapshot = await getNetworkSnapshot();
  const tickerItems = snapshot.recentActivity.slice(0, 8).map((item) => ({
    timestamp: formatActivityMarker(item.timestamp),
    description: `${item.profileHandle} × ${item.opportunityTitle} · ${item.score}% fit`
  }));
  const latestActivity = snapshot.recentActivity[0] ?? null;

  return (
    <div className="min-h-screen bg-[var(--bg-void)] text-[var(--text-primary)]">
      <AppNav />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <section className="section-reveal panel relative overflow-hidden rounded-[32px] px-6 py-10 sm:px-10 sm:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(31,191,143,0.12),transparent_42%)]" />
          <div className="absolute inset-x-0 bottom-0 h-56 pulse-dots" />
          <ConsensusPulse className="absolute right-6 top-6 hidden lg:block" />
          <div className="relative max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--accent-emerald-dim)] bg-[rgba(15,92,70,0.18)] px-4 py-2.5 text-base text-[var(--text-primary)]">
              <span className="h-2 w-2 rounded-full bg-[var(--accent-emerald)] status-dot" />
              Powered by GenLayer Consensus
            </div>
            <h1 className="max-w-3xl font-[family:var(--font-display)] text-5xl leading-[0.96] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
              Where Consensus Finds Talent.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--text-muted)] sm:text-xl">
              Agent.Recruit evaluates real evidence, not keyword stuffing. Talent and opportunities live onchain,
              while GenLayer validators score fit, refresh recommendations, and assemble draft teams in the background.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/app/talent"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[var(--accent-emerald)] px-6 py-3.5 text-base font-semibold text-[var(--bg-void)] shadow-[0_0_30px_rgba(31,191,143,0.15)]"
              >
                Create Your Profile
                <ActionBadge kind="sign" />
              </Link>
              <Link
                href="/app/opportunities"
                className="inline-flex items-center justify-center gap-3 rounded-full border border-[var(--accent-emerald-dim)] px-6 py-3.5 text-base font-semibold text-[var(--text-primary)]"
              >
                Post an Opportunity
                <ActionBadge kind="sign" />
              </Link>
            </div>
            <div className="mt-10 grid gap-4 rounded-[26px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] p-4 sm:grid-cols-3">
              {[
                ["Profiles Registered", String(snapshot.profiles.length)],
                ["Opportunities Live", String(snapshot.activeOpportunities.length)],
                ["Recent Match Events", String(snapshot.recentActivity.length)]
              ].map(([label, value]) => (
                <div key={label} className="rounded-[20px] border border-[var(--line-hairline)] bg-[rgba(10,14,12,0.55)] px-4 py-5">
                  <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
                  <p className="mt-2 font-mono text-3xl text-[var(--text-primary)]">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Link
                href="/app/personal"
                className="rounded-[24px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.03)] p-5 text-left transition hover:bg-[rgba(31,191,143,0.07)]"
              >
                <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Personal Dashboard</p>
                <h2 className="mt-2 text-2xl font-medium">See your owned profile, tier status, and every match tied to your wallet.</h2>
                <div className="mt-4 inline-flex items-center gap-2 text-base text-[var(--text-muted)]">
                  Open aspirant view
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </Link>
              <Link
                href="/app/founder"
                className="rounded-[24px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.03)] p-5 text-left transition hover:bg-[rgba(31,191,143,0.07)]"
              >
                <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Founder Dashboard</p>
                <h2 className="mt-2 text-2xl font-medium">Track wallet-owned opportunities, match records, and team drafts in one place.</h2>
                <div className="mt-4 inline-flex items-center gap-2 text-base text-[var(--text-muted)]">
                  Open founder view
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </Link>
            </div>
          </div>
        </section>

        <section className="section-reveal grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="panel rounded-[28px] p-6 sm:p-8">
            <p className="mb-3 inline-flex rounded-full border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-sm text-[var(--text-muted)]">
              Markets-inspired, evidence-first product design
            </p>
            <h2 className="font-[family:var(--font-display)] text-3xl tracking-[-0.04em] sm:text-4xl">
              The workflow is explicit about signatures and automation.
            </h2>
            <p className="mt-4 max-w-2xl text-[var(--text-muted)]">
              Profile and opportunity writes are signed. Tier review, match scoring, recommendation refresh, and team generation are
              automated relayer flows. The interface keeps that distinction visible with status strips, badges, and synced timestamps.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="hover-card rounded-[22px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] p-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[var(--accent-emerald)]" />
                  <span className="font-medium">Signed writes only</span>
                </div>
                <p className="mt-3 text-base leading-8 text-[var(--text-muted)]">
                  Create or update a profile. Create or update an opportunity. Every other action is relayer-driven.
                </p>
              </div>
              <div className="hover-card rounded-[22px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] p-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[var(--accent-emerald)]" />
                  <span className="font-medium">Consensus outcomes only</span>
                </div>
                <p className="mt-3 text-base leading-8 text-[var(--text-muted)]">
                  No validator reasoning, no hidden deliberation, no AI chain-of-thought. Only fit scores, tiers, and status outcomes.
                </p>
              </div>
            </div>
          </div>
          <div className="panel rounded-[28px] p-6 sm:p-8">
            <StatusStrip current="Evaluating" />
            <div className="mt-6 rounded-[24px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Talent Registry</p>
                  <h3 className="mt-2 text-2xl font-medium">
                    {snapshot.latestProfile?.headline || "Awaiting the first onchain profile"}
                  </h3>
                </div>
                <ActionBadge kind="automated" />
              </div>
              <p className="mt-4 text-base leading-8 text-[var(--text-muted)]">
                {snapshot.latestProfile
                  ? "The latest submitted profile is now available onchain and ready for relayer-driven review."
                  : "The deployed talent registry is live on Studionet and waiting for the first real profile submission."}
              </p>
              <div className="mt-5 flex items-center gap-3 font-mono text-sm text-[var(--text-muted)]">
                <span>{snapshot.latestProfile ? snapshot.latestProfile.handle : "No profiles yet"}</span>
                <span className="h-1 w-1 rounded-full bg-[var(--text-muted)]" />
                <span>{snapshot.latestProfile?.tier || "No tier yet"}</span>
              </div>
            </div>
          </div>
        </section>

        <section id="talent" className="section-reveal panel rounded-[30px] p-6 sm:p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Talent Registry</p>
              <h2 className="mt-2 font-[family:var(--font-display)] text-3xl tracking-[-0.04em] sm:text-4xl">
                Evidence-backed profiles with consensus-reviewed tiers.
              </h2>
            </div>
            <Link href="/app/talent" className="hidden items-center gap-2 text-base text-[var(--text-muted)] md:inline-flex">
              Open talent app
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {talentCards.map((card) => (
              <article key={card.title} className="hover-card rounded-[24px] border border-[var(--line-hairline)] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(31,191,143,0.03))] p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-2xl font-medium">{card.title}</h3>
                  <ActionBadge kind="sign" />
                </div>
                <p className="mt-3 text-base leading-8 text-[var(--text-muted)]">{card.copy}</p>
                <ul className="mt-5 space-y-3 text-base text-[var(--text-primary)]">
                  {card.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-[var(--accent-emerald)]" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="opportunities" className="section-reveal grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="panel rounded-[28px] p-6 sm:p-8">
            <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Opportunity Registry</p>
            <h2 className="mt-2 font-[family:var(--font-display)] text-3xl tracking-[-0.04em] sm:text-4xl">
              Founder opportunities with explicit slots, skills, and commitments.
            </h2>
            <p className="mt-4 text-[var(--text-muted)]">
              Founders publish role structures onchain. Updates require a signature, while every downstream fit score, cache refresh,
              and team draft stays automated.
            </p>
            <Link
              href="/app/opportunities"
              className="mt-6 inline-flex items-center justify-center gap-3 rounded-full border border-[var(--accent-emerald-dim)] px-5 py-3.5 text-base font-semibold"
            >
              Post Opportunity
              <ActionBadge kind="sign" />
            </Link>
          </div>
          <div className="panel rounded-[28px] p-6 sm:p-8">
            <div className="rounded-[24px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-base text-[var(--text-muted)]">Live opportunity card</p>
                  <h3 className="mt-1 text-2xl font-medium">
                    {snapshot.latestOpportunity?.title || "No opportunity posted yet"}
                  </h3>
                </div>
              </div>
              <p className="mt-4 text-base leading-8 text-[var(--text-muted)]">
                {snapshot.latestOpportunity?.summary ||
                  "The opportunity registry is deployed and ready for the first founder submission."}
              </p>
              {snapshot.latestOpportunity ? (
                <>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {snapshot.latestOpportunity.requiredSkills.map((skill) => (
                      <span key={skill} className="rounded-full border border-[var(--line-hairline)] px-3 py-1.5 text-sm text-[var(--text-muted)]">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {snapshot.latestOpportunity.slots.map((slot) => (
                      <div key={slot.slotKey} className="rounded-[18px] border border-[var(--line-hairline)] bg-[rgba(10,14,12,0.6)] px-3 py-4">
                        <p className="text-base font-medium">{slot.role}</p>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                          {slot.requiredSkills.length > 0 ? slot.requiredSkills.join(" / ") : "Required skills to be added"}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </section>

        <section id="matching" className="section-reveal panel rounded-[30px] p-6 sm:p-8">
          <div className="flex items-start justify-between gap-5">
            <div className="max-w-2xl">
              <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Matching Engine</p>
              <h2 className="mt-2 font-[family:var(--font-display)] text-3xl tracking-[-0.04em] sm:text-4xl">
                Focused-pair consensus scoring that still feels alive across the network.
              </h2>
              <p className="mt-4 text-[var(--text-muted)]">
                Every viewed profile-opportunity pair becomes a real match event. Fit scores are persisted onchain and reflected in the
                recent activity feed, recommendation cache, and team draft pipeline.
              </p>
            </div>
            <ActionBadge kind="automated" />
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
            <div className="relative overflow-hidden rounded-[26px] border border-[var(--line-hairline)] bg-[linear-gradient(135deg,rgba(18,24,21,0.98),rgba(31,191,143,0.08))] p-6">
              <div className="absolute inset-0 pulse-dots opacity-45" />
              <div className="relative grid gap-5 sm:grid-cols-[0.65fr_1fr]">
                <div className="rounded-[22px] border border-[var(--line-hairline)] bg-[rgba(0,0,0,0.34)] p-4">
                  <div className="space-y-3">
                    {["Leader validator", "Peer validator", "Peer validator"].map((label, index) => (
                      <div key={`${label}-${index}`} className="flex items-center gap-3 rounded-full border border-[rgba(255,255,255,0.06)] px-3 py-2.5 text-base text-[var(--text-muted)]">
                        <span className="h-2 w-2 rounded-full bg-[var(--accent-emerald)]" style={{ opacity: 1 - index * 0.18 }} />
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[22px] border border-[var(--line-hairline)] bg-[rgba(10,14,12,0.7)] p-5">
                  <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Outcome only</p>
                  <div className="mt-4 inline-flex rounded-full bg-[rgba(31,191,143,0.14)] px-4 py-2 font-mono text-lg text-[var(--accent-emerald)]">
                    {latestActivity ? `${latestActivity.score}% Consensus Fit` : "Awaiting first onchain match"}
                  </div>
                  <p className="mt-4 text-base leading-8 text-[var(--text-muted)]">
                    {latestActivity
                      ? `Latest recorded pair: ${latestActivity.profileHandle} × ${latestActivity.opportunityTitle}.`
                      : "Final fit scores will appear here after the relayer submits the first match request."}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-[26px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] p-5">
              <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Recommendation Cache</p>
              <h3 className="mt-3 text-2xl font-medium">Fresh when it matters.</h3>
              <p className="mt-3 text-base leading-8 text-[var(--text-muted)]">
                Evaluations are cached for instant reads and only recomputed when profile or opportunity versions change.
              </p>
              <div className="mt-5 space-y-3 rounded-[22px] border border-[var(--line-hairline)] bg-[rgba(10,14,12,0.65)] p-4">
                {latestActivity ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{latestActivity.profileHandle} × {latestActivity.opportunityTitle}</span>
                      <span className="rounded-full border border-[var(--line-hairline)] px-3 py-1.5 font-mono text-sm text-[var(--text-muted)]">
                        {latestActivity.band}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-base text-[var(--text-muted)]">
                      <span>{latestActivity.score}% fit</span>
                      <span className="font-mono">{formatActivityMarker(latestActivity.timestamp)}</span>
                    </div>
                    <div className="rounded-full border border-[var(--line-hairline)] px-3 py-1.5 font-mono text-sm text-[var(--text-muted)]">
                      Recent onchain match activity
                    </div>
                  </>
                ) : (
                  <div className="text-base leading-8 text-[var(--text-muted)]">
                    No cached match activity exists yet. Submit a profile and an opportunity first, then let the relayer drive matching.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="section-reveal">
          <RecentActivityTicker items={tickerItems} />
        </section>

        <section id="teams" className="section-reveal grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <div className="panel rounded-[28px] p-6 sm:p-8">
            <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Team Formation</p>
            <h2 className="mt-2 font-[family:var(--font-display)] text-3xl tracking-[-0.04em] sm:text-4xl">
              Auto-best-fit draft teams, filled from fresh consensus scores.
            </h2>
            <p className="mt-4 text-[var(--text-muted)]">
              A founder’s single automated action can shortlist matching talent, trigger missing pair evaluations, and write a draft team outcome onchain.
            </p>
          </div>
          <div className="panel rounded-[28px] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-2xl font-medium">Draft team preview</h3>
              <ActionBadge kind="automated" />
            </div>
            <div className="mt-5 space-y-3">
              {snapshot.latestTeamDraft?.assignments.length ? (
                snapshot.latestTeamDraft.assignments.map((assignment) => (
                  <div key={assignment.slotKey} className="rounded-[20px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{assignment.role}</p>
                        <p className="mt-1 text-base text-[var(--text-muted)]">
                          {assignment.profileHandle || "Waiting for qualified profile"}
                        </p>
                      </div>
                      <div className="rounded-full border border-[var(--line-hairline)] px-3 py-1.5 font-mono text-sm text-[var(--text-muted)]">
                        {assignment.status === "Matched" ? `${assignment.score}% fit` : "Open"}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[20px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] p-4 text-base leading-8 text-[var(--text-muted)]">
                  No team draft has been generated onchain yet.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="section-reveal panel rounded-[28px] px-6 py-10 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Why GenLayer</p>
            <h2 className="mt-3 font-[family:var(--font-display)] text-3xl tracking-[-0.04em] sm:text-4xl">
              Recruitment quality is subjective. Consensus makes that a feature, not a flaw.
            </h2>
            <p className="mt-4 text-[var(--text-muted)]">
              Profiles, evidence, and opportunity structure deserve more than single-model keyword scoring. Agent.Recruit uses independent validators
              to produce shared, onchain outcomes for tiers, fit scores, and team drafts.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4 text-[var(--accent-emerald)]">
              <Waves className="h-5 w-5" />
              <div className="h-px w-16 bg-[var(--accent-emerald-dim)]" />
              <span className="h-3 w-3 rounded-full bg-[var(--accent-emerald)]" />
              <div className="h-px w-16 bg-[var(--accent-emerald-dim)]" />
              <Waves className="h-5 w-5" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
