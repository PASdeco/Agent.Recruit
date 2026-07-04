import { StateStore } from "./state-store.js";
import { relayerConfig, relayerRuntime } from "./config.js";
import {
  generateTeamDraft,
  getMatch,
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
  return opportunity.requiredSkills.some((skill) => skillSet.has(skill.toLowerCase()));
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
  for (const opportunity of opportunities) {
    if (opportunity.status !== "Active") {
      continue;
    }
    for (const profile of profiles) {
      if (!shareRequiredSkills(profile, opportunity)) {
        continue;
      }
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
