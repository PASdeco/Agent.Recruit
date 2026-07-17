import { createAccount, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import type { MatchRecord, Opportunity, Profile, TeamDraft } from "./types.js";
import { relayerConfig } from "./config.js";

type ContractName =
  | "talentRegistry"
  | "opportunityRegistry"
  | "matchingEngine"
  | "teamFormation";

type ContractArg = string | number | bigint | boolean | null;

const addresses: Record<ContractName, string> = {
  talentRegistry: relayerConfig.TALENT_REGISTRY_ADDRESS,
  opportunityRegistry: relayerConfig.OPPORTUNITY_REGISTRY_ADDRESS,
  matchingEngine: relayerConfig.MATCHING_ENGINE_ADDRESS,
  teamFormation: relayerConfig.TEAM_FORMATION_ADDRESS
};

const readClient = createClient({
  chain: studionet,
  endpoint: relayerConfig.GENLAYER_RPC_URL
});

const acceptanceWait = {
  status: TransactionStatus.ACCEPTED,
  interval: 5000,
  retries: 72
} as const;

const writeClient = relayerConfig.RELAYER_PRIVATE_KEY
  ? createClient({
      chain: studionet,
      endpoint: relayerConfig.GENLAYER_RPC_URL,
      account: createAccount(relayerConfig.RELAYER_PRIVATE_KEY as `0x${string}`)
    })
  : null;

async function jsonCall(contract: ContractName, method: string, args: ContractArg[] = []) {
  const address = addresses[contract];
  if (!address) {
    throw new Error(`Missing ${contract} contract address.`);
  }
  return readClient.readContract({
    address: address as `0x${string}`,
    functionName: method,
    args
  });
}

async function writeCall(contract: ContractName, method: string, args: ContractArg[] = []) {
  const address = addresses[contract];
  if (!address) {
    throw new Error(`Missing ${contract} contract address.`);
  }
  if (!writeClient) {
    throw new Error("RELAYER_PRIVATE_KEY is required for automated writes.");
  }

  const hash = await writeClient.writeContract({
    address: address as `0x${string}`,
    functionName: method,
    args,
    value: BigInt(0)
  });

  await readClient.waitForTransactionReceipt({
    hash,
    ...acceptanceWait
  });

  return hash;
}

function isPublicUrl(value: string) {
  return /^https?:\/\//i.test(value.trim());
}

function countPublicProofUrls(profile: Profile) {
  const urls = new Set<string>();

  for (const value of [
    profile.githubUrl,
    profile.resumeUrl,
    profile.portfolioUrl,
    profile.linkedinUrl,
    ...profile.socials,
    ...profile.evidence.map((item) => item.value)
  ]) {
    const normalized = String(value || "").trim();
    if (isPublicUrl(normalized)) {
      urls.add(normalized);
    }
  }

  return urls.size;
}

export async function listProfiles() {
  const result = await jsonCall("talentRegistry", "list_profiles");
  return JSON.parse(String(result ?? "[]")) as Profile[];
}

export async function listOpportunities() {
  const result = await jsonCall("opportunityRegistry", "list_opportunities");
  return JSON.parse(String(result ?? "[]")) as Opportunity[];
}

export async function getMatch(profileId: number, opportunityId: number) {
  const result = await jsonCall("matchingEngine", "get_match", [profileId, opportunityId]);
  if (!result) {
    return null;
  }
  const text = String(result);
  if (!text) {
    return null;
  }
  return JSON.parse(text) as MatchRecord;
}

export async function listMatchesForOpportunity(opportunityId: number) {
  const result = await jsonCall("matchingEngine", "list_matches_for_opportunity", [opportunityId]);
  return JSON.parse(String(result ?? "[]")) as MatchRecord[];
}

export async function requestProfileReview(profile: Profile) {
  const proofUrlCount = countPublicProofUrls(profile);

  return writeCall("talentRegistry", "request_profile_review", [
    profile.profileId,
    [
      `Skills: ${profile.skills.join(", ")}`,
      `Role preferences: ${profile.rolePreferences.join(", ")}`,
      `Public proof URL count: ${proofUrlCount}`,
      "Render pattern: TalentRegistry renders stored public proof URLs with gl.nondet.web.render before AI review"
    ].join(" | "),
    `Handle: ${profile.handle} | Headline: ${profile.headline} | Availability: ${profile.availability} | Location: ${profile.location}`
  ]);
}

export async function requestMatch(profile: Profile, opportunity: Opportunity) {
  return writeCall("matchingEngine", "request_match", [
    profile.profileId,
    opportunity.opportunityId,
    profile.version,
    opportunity.version,
    JSON.stringify(profile),
    JSON.stringify(opportunity)
  ]);
}

export async function generateTeamDraft(opportunity: Opportunity, matches: MatchRecord[]) {
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

  return writeCall("teamFormation", "generate_team_draft", [
    opportunity.opportunityId,
    opportunity.version,
    JSON.stringify(opportunity.slots),
    JSON.stringify(candidates)
  ]);
}

export async function getTeamDraft(opportunityId: number) {
  const result = await jsonCall("teamFormation", "get_team_draft_by_opportunity", [opportunityId]);
  const text = String(result ?? "");
  if (!text) {
    return null;
  }
  return JSON.parse(text) as TeamDraft;
}
