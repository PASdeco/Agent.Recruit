import "server-only";

import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

type Profile = {
  profileId: number;
  handle: string;
  headline: string;
  tier: string;
  updatedAt: number;
  reviewedAt: number;
};

type OpportunitySlot = {
  slotKey: string;
  role: string;
  requiredSkills: string[];
};

type Opportunity = {
  opportunityId: number;
  title: string;
  summary: string;
  requiredSkills: string[];
  slots: OpportunitySlot[];
  status: "Active" | "Archived";
  updatedAt: number;
};

type MatchActivity = {
  timestamp: number;
  label: string;
  opportunityTitle: string;
  profileHandle: string;
  score: number;
  band: string;
};

type TeamDraft = {
  opportunityId: number;
  status: string;
  assignments: Array<{
    slotKey: string;
    role: string;
    profileHandle: string;
    score: number;
    status: string;
  }>;
};

const env = {
  rpcUrl: process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || "https://studio.genlayer.com/api",
  talentRegistry: process.env.NEXT_PUBLIC_TALENT_REGISTRY_ADDRESS || "",
  opportunityRegistry: process.env.NEXT_PUBLIC_OPPORTUNITY_REGISTRY_ADDRESS || "",
  matchingEngine: process.env.NEXT_PUBLIC_MATCHING_ENGINE_ADDRESS || "",
  teamFormation: process.env.NEXT_PUBLIC_TEAM_FORMATION_ADDRESS || ""
};

const client = createClient({
  chain: studionet,
  endpoint: env.rpcUrl
});

async function readJson<T>(address: string, functionName: string, fallback: T, args: Array<string | number> = []) {
  if (!address) {
    return fallback;
  }

  try {
    const result = await client.readContract({
      address: address as `0x${string}`,
      functionName,
      args
    });
    const text = String(result ?? "");
    if (!text) {
      return fallback;
    }
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

export async function getNetworkSnapshot() {
  const [profiles, opportunities, recentActivity] = await Promise.all([
    readJson<Profile[]>(env.talentRegistry, "list_profiles", []),
    readJson<Opportunity[]>(env.opportunityRegistry, "list_opportunities", []),
    readJson<MatchActivity[]>(env.matchingEngine, "list_recent_match_activity", [])
  ]);

  const activeOpportunities = opportunities.filter((item) => item.status === "Active");
  const latestProfile = [...profiles].sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null;
  const latestOpportunity = [...activeOpportunities].sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null;
  const latestTeamDraft = latestOpportunity
    ? await readJson<TeamDraft | null>(
        env.teamFormation,
        "get_team_draft_by_opportunity",
        null,
        [latestOpportunity.opportunityId]
      )
    : null;

  return {
    profiles,
    activeOpportunities,
    recentActivity,
    latestProfile,
    latestOpportunity,
    latestTeamDraft
  };
}
