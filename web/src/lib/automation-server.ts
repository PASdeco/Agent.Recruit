import { createAccount, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import type { MatchRecord, OwnedOpportunity, OwnedProfile, TeamDraft } from "./genlayer";

type AutomationAction =
  | {
      status: "disabled";
      action: "none";
      message: string;
    }
  | {
      status: "accepted";
      action: "profile-review" | "match-refresh" | "team-draft";
      message: string;
      hash: string;
      targetId: number;
    }
  | {
      status: "noop";
      action: "none";
      message: string;
    };

type AutomationPriority = {
  ownerAddress?: string;
};

type ContractName = "talentRegistry" | "opportunityRegistry" | "matchingEngine" | "teamFormation";
type ContractArg = string | number | bigint | boolean | null;

const automationEnv = {
  rpcUrl: process.env.GENLAYER_RPC_URL || process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || "https://studio.genlayer.com/api",
  relayerAccountAddress: process.env.RELAYER_ACCOUNT_ADDRESS || "",
  relayerPrivateKey: process.env.RELAYER_PRIVATE_KEY || "",
  talentRegistry: process.env.TALENT_REGISTRY_ADDRESS || process.env.NEXT_PUBLIC_TALENT_REGISTRY_ADDRESS || "",
  opportunityRegistry: process.env.OPPORTUNITY_REGISTRY_ADDRESS || process.env.NEXT_PUBLIC_OPPORTUNITY_REGISTRY_ADDRESS || "",
  matchingEngine: process.env.MATCHING_ENGINE_ADDRESS || process.env.NEXT_PUBLIC_MATCHING_ENGINE_ADDRESS || "",
  teamFormation: process.env.TEAM_FORMATION_ADDRESS || process.env.NEXT_PUBLIC_TEAM_FORMATION_ADDRESS || ""
};

const acceptanceWait = {
  status: TransactionStatus.ACCEPTED,
  interval: 5000,
  retries: 72
} as const;

function getContractAddress(contract: ContractName) {
  return automationEnv[contract];
}

function hasAutomationConfig() {
  return Boolean(
    automationEnv.relayerPrivateKey &&
      automationEnv.talentRegistry &&
      automationEnv.opportunityRegistry &&
      automationEnv.matchingEngine &&
      automationEnv.teamFormation
  );
}

function assertAutomationConfig() {
  if (!hasAutomationConfig()) {
    throw new Error("Server automation is missing relayer credentials or deployed contract addresses.");
  }

  if (automationEnv.relayerAccountAddress) {
    const derivedAddress = createAccount(automationEnv.relayerPrivateKey as `0x${string}`).address.toLowerCase();
    if (automationEnv.relayerAccountAddress.toLowerCase() !== derivedAddress) {
      throw new Error("RELAYER_ACCOUNT_ADDRESS does not match the configured RELAYER_PRIVATE_KEY.");
    }
  }
}

function createReadClient() {
  return createClient({
    chain: studionet,
    endpoint: automationEnv.rpcUrl
  });
}

function createWriteClient() {
  return createClient({
    chain: studionet,
    endpoint: automationEnv.rpcUrl,
    account: createAccount(automationEnv.relayerPrivateKey as `0x${string}`)
  });
}

async function readJson<T>(
  client: ReturnType<typeof createReadClient>,
  contract: ContractName,
  functionName: string,
  fallback: T,
  args: ContractArg[] = []
) {
  const address = getContractAddress(contract);
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

async function writeAcceptedTransaction(
  readClient: ReturnType<typeof createReadClient>,
  writeClient: ReturnType<typeof createWriteClient>,
  contract: ContractName,
  functionName: string,
  args: ContractArg[] = []
) {
  const address = getContractAddress(contract);
  if (!address) {
    throw new Error(`Missing ${contract} contract address.`);
  }

  const hash = await writeClient.writeContract({
    address: address as `0x${string}`,
    functionName,
    args,
    value: BigInt(0)
  });

  await readClient.waitForTransactionReceipt({
    hash,
    ...acceptanceWait
  });

  return hash;
}

function needsProfileReview(profile: OwnedProfile) {
  return !(profile.reviewedAt && profile.reviewedAt >= profile.updatedAt);
}

function sharedSkillCount(profile: OwnedProfile, opportunity: OwnedOpportunity) {
  const skills = new Set(profile.skills.map((skill) => skill.toLowerCase()));
  let overlaps = 0;
  for (const skill of opportunity.requiredSkills) {
    if (skills.has(skill.toLowerCase())) {
      overlaps += 1;
    }
  }
  return overlaps;
}

function buildExpectedAssignments(opportunity: OwnedOpportunity, matches: MatchRecord[]) {
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
    let best: (typeof candidates)[number] | null = null;

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
        band: "Weak" as const,
        status: "Open" as const
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
      status: "Matched" as const
    };
  });
}

function isTeamDraftCurrent(opportunity: OwnedOpportunity, matches: MatchRecord[], teamDraft: TeamDraft | null) {
  if (!teamDraft) {
    return matches.length === 0;
  }
  if (teamDraft.opportunityVersion !== opportunity.version) {
    return false;
  }

  const expectedAssignments = buildExpectedAssignments(opportunity, matches);
  if (teamDraft.assignments.length !== expectedAssignments.length) {
    return false;
  }

  return expectedAssignments.every((expected, index) => {
    const current = teamDraft.assignments[index];
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

function ownerPriority(ownerAddress: string | undefined, candidateOwner: string) {
  if (!ownerAddress) {
    return 0;
  }
  return candidateOwner.toLowerCase() === ownerAddress.toLowerCase() ? 1 : 0;
}

function isPublicUrl(value: string) {
  return /^https?:\/\//i.test(value.trim());
}

function countPublicProofUrls(profile: OwnedProfile) {
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

export async function runAutomationStep(priority: AutomationPriority = {}): Promise<AutomationAction> {
  if (!hasAutomationConfig()) {
    return {
      status: "disabled",
      action: "none",
      message: "Server automation is not configured yet."
    };
  }

  assertAutomationConfig();

  const readClient = createReadClient();
  const writeClient = createWriteClient();

  const [profiles, opportunities] = await Promise.all([
    readJson<OwnedProfile[]>(readClient, "talentRegistry", "list_profiles", []),
    readJson<OwnedOpportunity[]>(readClient, "opportunityRegistry", "list_opportunities", [])
  ]);

  const pendingReview = [...profiles]
    .filter(needsProfileReview)
    .sort((left, right) => {
      const ownerDelta =
        ownerPriority(priority.ownerAddress, right.owner) - ownerPriority(priority.ownerAddress, left.owner);
      if (ownerDelta !== 0) {
        return ownerDelta;
      }
      return right.updatedAt - left.updatedAt;
    })[0];

  if (pendingReview) {
    const proofUrlCount = countPublicProofUrls(pendingReview);

    const hash = await writeAcceptedTransaction(readClient, writeClient, "talentRegistry", "request_profile_review", [
      pendingReview.profileId,
      [
        `Skills: ${pendingReview.skills.join(", ")}`,
        `Role preferences: ${pendingReview.rolePreferences.join(", ")}`,
        `Public proof URL count: ${proofUrlCount}`,
        "Render pattern: TalentRegistry renders stored public proof URLs with gl.nondet.web.render before AI review"
      ].join(" | "),
      `Handle: ${pendingReview.handle} | Headline: ${pendingReview.headline} | Availability: ${pendingReview.availability} | Location: ${pendingReview.location}`
    ]);

    return {
      status: "accepted",
      action: "profile-review",
      message: `Reviewed profile #${pendingReview.profileId}.`,
      hash,
      targetId: pendingReview.profileId
    };
  }

  const activeOpportunities = [...opportunities]
    .filter((opportunity) => opportunity.status === "Active")
    .sort((left, right) => {
      const ownerDelta =
        ownerPriority(priority.ownerAddress, right.owner) - ownerPriority(priority.ownerAddress, left.owner);
      if (ownerDelta !== 0) {
        return ownerDelta;
      }
      const updatedDelta = right.updatedAt - left.updatedAt;
      if (updatedDelta !== 0) {
        return updatedDelta;
      }
      return right.opportunityId - left.opportunityId;
    });

  for (const opportunity of activeOpportunities) {
    const rankedProfiles = [...profiles].sort((left, right) => {
      const ownerDelta =
        ownerPriority(priority.ownerAddress, right.owner) - ownerPriority(priority.ownerAddress, left.owner);
      if (ownerDelta !== 0) {
        return ownerDelta;
      }
      const overlapDelta = sharedSkillCount(right, opportunity) - sharedSkillCount(left, opportunity);
      if (overlapDelta !== 0) {
        return overlapDelta;
      }
      return right.updatedAt - left.updatedAt;
    });

    for (const profile of rankedProfiles) {
      const existing = await readJson<MatchRecord | null>(
        readClient,
        "matchingEngine",
        "get_match",
        null,
        [profile.profileId, opportunity.opportunityId]
      );
      const stale =
        !existing ||
        existing.profileVersion !== profile.version ||
        existing.opportunityVersion !== opportunity.version;
      if (!stale) {
        continue;
      }

      const hash = await writeAcceptedTransaction(readClient, writeClient, "matchingEngine", "request_match", [
        profile.profileId,
        opportunity.opportunityId,
        profile.version,
        opportunity.version,
        JSON.stringify(profile),
        JSON.stringify(opportunity)
      ]);

      return {
        status: "accepted",
        action: "match-refresh",
        message: `Synced profile #${profile.profileId} against opportunity #${opportunity.opportunityId}.`,
        hash,
        targetId: opportunity.opportunityId
      };
    }
  }

  for (const opportunity of activeOpportunities) {
    const [matches, teamDraft] = await Promise.all([
      readJson<MatchRecord[]>(readClient, "matchingEngine", "list_matches_for_opportunity", [], [opportunity.opportunityId]),
      readJson<TeamDraft | null>(readClient, "teamFormation", "get_team_draft_by_opportunity", null, [opportunity.opportunityId])
    ]);

    if (isTeamDraftCurrent(opportunity, matches, teamDraft)) {
      continue;
    }

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

    const hash = await writeAcceptedTransaction(readClient, writeClient, "teamFormation", "generate_team_draft", [
      opportunity.opportunityId,
      opportunity.version,
      JSON.stringify(opportunity.slots),
      JSON.stringify(candidates)
    ]);

    return {
      status: "accepted",
      action: "team-draft",
      message: `Generated a team draft for opportunity #${opportunity.opportunityId}.`,
      hash,
      targetId: opportunity.opportunityId
    };
  }

  return {
    status: "noop",
    action: "none",
    message: "Automation is already up to date."
  };
}
