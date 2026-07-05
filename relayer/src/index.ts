import { StateStore } from "./state-store.js";
import { relayerConfig, relayerRuntime } from "./config.js";
import {
  generateTeamDraft,
  getMatch,
  getTeamDraft,
  listMatchesForOpportunity,
  listOpportunities,
  listProfiles,
  requestMatch,
  requestProfileReview
} from "./genlayer.js";
import { summarizeFailure } from "./status.js";
import type { JobKind, Opportunity, Profile } from "./types.js";

const state = new StateStore();

function markJob(key: string, kind: JobKind, lastOutcome: "success" | "retry" | "error", message: string) {
  const current = state.getJob(key);
  state.setJob({
    key,
    kind,
    attempts: (current?.attempts ?? 0) + 1,
    lastRunAt: Date.now(),
    lastOutcome,
    message
  });
}

function shareRequiredSkills(profile: Profile, opportunity: Opportunity) {
  const skillSet = new Set(profile.skills.map((skill) => skill.toLowerCase()));
  let overlaps = 0;
  for (const skill of opportunity.requiredSkills) {
    if (skillSet.has(skill.toLowerCase())) {
      overlaps += 1;
    }
  }
  return overlaps;
}

function buildExpectedAssignments(opportunity: Opportunity, matches: Awaited<ReturnType<typeof listMatchesForOpportunity>>) {
  const candidates = matches.flatMap((match) =>
    opportunity.slots.map((slot) => ({
      slotKey: slot.slotKey,
      role: slot.role,
      profileId: match.profileId,
      profileHandle: match.profileHandle,
      score: match.score,
      band: match.band
    }))
  );

  const used = new Set<number>();

  return opportunity.slots.map((slot) => {
    let best = null as (typeof candidates)[number] | null;

    for (const candidate of candidates) {
      if (candidate.slotKey !== slot.slotKey || used.has(candidate.profileId)) {
        continue;
      }
      if (!best || candidate.score > best.score) {
        best = candidate;
      }
    }

    if (!best) {
      return {
        slotKey: slot.slotKey,
        role: slot.role,
        profileId: 0,
        profileHandle: "",
        score: 0,
        band: "Weak",
        status: "Open"
      };
    }

    used.add(best.profileId);
    return {
      slotKey: slot.slotKey,
      role: slot.role,
      profileId: best.profileId,
      profileHandle: best.profileHandle,
      score: best.score,
      band: best.band,
      status: "Matched"
    };
  });
}

async function isTeamDraftCurrent(opportunity: Opportunity, matches: Awaited<ReturnType<typeof listMatchesForOpportunity>>) {
  const draft = await getTeamDraft(opportunity.opportunityId);
  if (!draft) {
    return matches.length === 0;
  }
  if (draft.opportunityVersion !== opportunity.version) {
    return false;
  }

  const expectedAssignments = buildExpectedAssignments(opportunity, matches);
  if (draft.assignments.length !== expectedAssignments.length) {
    return false;
  }

  return expectedAssignments.every((expected, index) => {
    const current = draft.assignments[index];
    return (
      current.slotKey === expected.slotKey &&
      current.role === expected.role &&
      current.profileId === expected.profileId &&
      current.profileHandle === expected.profileHandle &&
      current.score === expected.score &&
      current.band === expected.band &&
      current.status === expected.status
    );
  });
}

async function queueProfileReviews(profiles: Profile[]) {
  for (const profile of profiles) {
    if (profile.reviewedAt && profile.reviewedAt >= profile.updatedAt) {
      continue;
    }
    try {
      await requestProfileReview(profile);
      state.setProfileVersion(profile.profileId, profile.version);
      markJob(`profile-review:${profile.profileId}`, "profile-review", "success", "Profile review scheduled.");
    } catch (error) {
      markJob(
        `profile-review:${profile.profileId}`,
        "profile-review",
        "retry",
        summarizeFailure(error)
      );
    }
  }
}

async function queueFocusedPairMatches(profiles: Profile[], opportunities: Opportunity[]) {
  const rankedOpportunities = [...opportunities].filter((opportunity) => opportunity.status === "Active");

  for (const opportunity of rankedOpportunities) {
    const rankedProfiles = [...profiles].sort((left, right) => {
      const overlapDelta = shareRequiredSkills(right, opportunity) - shareRequiredSkills(left, opportunity);
      if (overlapDelta !== 0) {
        return overlapDelta;
      }
      return left.profileId - right.profileId;
    });

    for (const profile of rankedProfiles) {
      const existing = await getMatch(profile.profileId, opportunity.opportunityId);
      const stale =
        !existing ||
        existing.profileVersion !== profile.version ||
        existing.opportunityVersion !== opportunity.version;
      if (!stale) {
        continue;
      }
      try {
        await requestMatch(profile, opportunity);
        markJob(
          `match:${profile.profileId}:${opportunity.opportunityId}`,
          "match-refresh",
          "success",
          "Focused-pair match scheduled."
        );
      } catch (error) {
        markJob(
          `match:${profile.profileId}:${opportunity.opportunityId}`,
          "match-refresh",
          "retry",
          summarizeFailure(error)
        );
      }
    }
  }
}

async function queueTeamDrafts(opportunities: Opportunity[]) {
  for (const opportunity of opportunities) {
    if (opportunity.status !== "Active") {
      continue;
    }
    try {
      const matches = await listMatchesForOpportunity(opportunity.opportunityId);
      const current = await isTeamDraftCurrent(opportunity, matches);
      if (current) {
        continue;
      }
      await generateTeamDraft(opportunity, matches);
      state.setOpportunityVersion(opportunity.opportunityId, opportunity.version);
      markJob(`team:${opportunity.opportunityId}`, "team-draft", "success", "Team draft scheduled.");
    } catch (error) {
      markJob(`team:${opportunity.opportunityId}`, "team-draft", "retry", summarizeFailure(error));
    }
  }
}

async function runCycle() {
  if (!relayerRuntime.hasReadAddresses) {
    console.log("Relayer standby: waiting for deployed contract addresses in deployments/studionet.json.");
    return;
  }
  if (!relayerRuntime.hasWriteCredentials) {
    console.log("Relayer standby: waiting for RELAYER_PRIVATE_KEY before scheduling automated writes.");
    return;
  }
  const profiles = await listProfiles();
  const opportunities = await listOpportunities();
  await queueProfileReviews(profiles);
  await queueFocusedPairMatches(profiles, opportunities);
  await queueTeamDrafts(opportunities);
}

async function main() {
  console.log(`Agent relayer watching ${relayerConfig.GENLAYER_NETWORK} at ${relayerConfig.GENLAYER_RPC_URL}`);
  await runCycle();
  setInterval(() => {
    void runCycle();
  }, relayerConfig.RELAYER_LOOP_MS);
}

void main();
