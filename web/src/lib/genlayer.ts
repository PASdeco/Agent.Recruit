import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

type InjectedProvider = {
  request: (args: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<unknown>;
  providers?: InjectedProvider[];
  isMetaMask?: boolean;
  isNightly?: boolean;
  isNightlyWallet?: boolean;
};

type ProfileInput = {
  handle: string;
  headline: string;
  summary: string;
  skills: string[];
  rolePreferences: string[];
  availability: string;
  location: string;
  githubUrl: string;
  resumeUrl: string;
  portfolioUrl: string;
  linkedinUrl: string;
  socials: string[];
  evidence: Array<{ label: string; value: string }>;
};

type OpportunityInput = {
  title: string;
  mission: string;
  summary: string;
  requiredSkills: string[];
  seniority: string;
  commitment: string;
  locationMode: string;
  compensationText: string;
  slots: Array<{ slotKey: string; role: string; requiredSkills: string[] }>;
};

export type OwnedProfile = {
  profileId: number;
  owner: string;
  handle: string;
  headline: string;
  summary: string;
  skills: string[];
  rolePreferences: string[];
  availability: string;
  location: string;
  githubUrl: string;
  resumeUrl: string;
  portfolioUrl: string;
  linkedinUrl: string;
  socials: string[];
  evidence: Array<{ label: string; value: string }>;
  tier: string;
  reviewStatus: string;
  version: number;
  createdAt: number;
  updatedAt: number;
  reviewedAt: number;
};

export type OwnedOpportunity = {
  opportunityId: number;
  owner: string;
  title: string;
  mission: string;
  summary: string;
  requiredSkills: string[];
  seniority: string;
  commitment: string;
  locationMode: string;
  compensationText: string;
  slots: Array<{ slotKey: string; role: string; requiredSkills: string[] }>;
  status: "Active" | "Archived";
  version: number;
  createdAt: number;
  updatedAt: number;
};

export type MatchRecord = {
  matchKey: string;
  profileId: number;
  opportunityId: number;
  profileHandle: string;
  opportunityTitle: string;
  score: number;
  band: "Weak" | "Emerging" | "Strong" | "Excellent";
  summary: string;
  profileVersion: number;
  opportunityVersion: number;
  status: string;
  createdAt: number;
  updatedAt: number;
  syncedAt: number;
};

export type TeamDraft = {
  opportunityId: number;
  opportunityVersion: number;
  status: "Ready" | "InsufficientCandidates";
  filledSlots: number;
  totalSlots: number;
  assignments: Array<{
    slotKey: string;
    role: string;
    profileId: number;
    profileHandle: string;
    score: number;
    band: "Weak" | "Emerging" | "Strong" | "Excellent";
    status: "Matched" | "Open";
  }>;
  updatedAt: number;
  syncedAt: number;
};

export type PersonalDashboardData = {
  walletAddress: string;
  profiles: Array<OwnedProfile & { matches: MatchRecord[] }>;
};

export type FounderDashboardData = {
  walletAddress: string;
  opportunities: Array<OwnedOpportunity & { matches: MatchRecord[]; teamDraft: TeamDraft | null }>;
};

const env = {
  rpcUrl: process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || "https://studio.genlayer.com/api",
  talentRegistry: process.env.NEXT_PUBLIC_TALENT_REGISTRY_ADDRESS || "",
  opportunityRegistry: process.env.NEXT_PUBLIC_OPPORTUNITY_REGISTRY_ADDRESS || "",
  matchingEngine: process.env.NEXT_PUBLIC_MATCHING_ENGINE_ADDRESS || "",
  teamFormation: process.env.NEXT_PUBLIC_TEAM_FORMATION_ADDRESS || ""
};

const walletStorageKey = "agent-wallet-address";
const walletChangeEventName = "agent-wallet-address-changed";

function getInjectedProvider() {
  if (typeof window === "undefined") {
    return null;
  }

  const injected = (window as Window & { ethereum?: InjectedProvider }).ethereum;
  if (!injected) {
    return null;
  }

  if (Array.isArray(injected.providers) && injected.providers.length > 0) {
    return (
      injected.providers.find((provider) => provider.isNightly || provider.isNightlyWallet) ||
      injected.providers.find((provider) => !provider.isMetaMask) ||
      injected.providers[0]
    );
  }

  return injected;
}

function storeWalletAddress(address: string) {
  window.localStorage.setItem(walletStorageKey, address);
  window.dispatchEvent(new CustomEvent<string>(walletChangeEventName, { detail: address }));
}

export function clearStoredWalletAddress() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(walletStorageKey);
    window.dispatchEvent(new CustomEvent<string>(walletChangeEventName, { detail: "" }));
  }
}

export function getStoredWalletAddress() {
  if (typeof window === "undefined") {
    return "";
  }
  return window.localStorage.getItem(walletStorageKey) ?? "";
}

export function subscribeWalletAddress(listener: (address: string) => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handler = (event: Event) => {
    const nextAddress = (event as CustomEvent<string>).detail ?? "";
    listener(nextAddress);
  };

  window.addEventListener(walletChangeEventName, handler);
  return () => {
    window.removeEventListener(walletChangeEventName, handler);
  };
}

export async function getConnectedWalletAddress() {
  const provider = getInjectedProvider();
  if (!provider) {
    return getStoredWalletAddress();
  }

  try {
    const result = await provider.request({ method: "eth_accounts" });
    const accounts = Array.isArray(result) ? result : [];
    const address = typeof accounts[0] === "string" ? accounts[0] : "";
    if (address) {
      storeWalletAddress(address);
      return address;
    }
  } catch {
    return getStoredWalletAddress();
  }

  return getStoredWalletAddress();
}

async function ensureStudionetChain(provider: InjectedProvider) {
  const targetChainId = `0x${studionet.id.toString(16)}`;
  const currentChainId = await provider.request({ method: "eth_chainId" }).catch(() => "");

  if (currentChainId === targetChainId) {
    return;
  }

  const explorerUrl =
    typeof studionet.blockExplorers?.default?.url === "string" ? studionet.blockExplorers.default.url : undefined;

  const chainParams = {
    chainId: targetChainId,
    chainName: studionet.name,
    rpcUrls: studionet.rpcUrls.default.http,
    nativeCurrency: studionet.nativeCurrency,
    ...(explorerUrl ? { blockExplorerUrls: [explorerUrl] } : {})
  };

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: targetChainId }]
    });
  } catch {
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [chainParams]
    });
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: targetChainId }]
    });
  }
}

export async function connectWallet() {
  const provider = getInjectedProvider();
  if (!provider) {
    throw new Error("No injected wallet was found. Open Nightly or MetaMask in this browser and try again.");
  }

  const currentAccounts = await provider.request({ method: "eth_accounts" }).catch(() => []);
  const connectedAccounts =
    Array.isArray(currentAccounts) && currentAccounts.length > 0
      ? currentAccounts
      : await provider.request({ method: "eth_requestAccounts" });

  const address = Array.isArray(connectedAccounts) ? String(connectedAccounts[0] ?? "") : "";
  if (!address) {
    throw new Error("Wallet connection did not return an account.");
  }

  await ensureStudionetChain(provider);
  storeWalletAddress(address);

  return { wallet: provider, address: address as `0x${string}` };
}

function createReadClient() {
  return createClient({
    chain: studionet,
    endpoint: env.rpcUrl
  });
}

async function readJson<T>(address: string, functionName: string, fallback: T, args: Array<string | number> = []) {
  if (!address) {
    return fallback;
  }

  const client = createReadClient();

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

function sortMatches(matches: MatchRecord[]) {
  return [...matches].sort((left, right) => {
    const syncDelta = right.syncedAt - left.syncedAt;
    if (syncDelta !== 0) {
      return syncDelta;
    }
    return right.score - left.score;
  });
}

async function createWriteClient() {
  const wallet = await connectWallet();
  return createClient({
    chain: studionet,
    endpoint: env.rpcUrl,
    account: wallet.address,
    provider: wallet.wallet
  });
}

export async function submitProfileWrite(profile: ProfileInput) {
  if (!env.talentRegistry) {
    throw new Error("Talent registry address is not configured.");
  }

  const readClient = createReadClient();
  const writeClient = await createWriteClient();

  const hash = await writeClient.writeContract({
    address: env.talentRegistry as `0x${string}`,
    functionName: "create_profile",
    args: [
      profile.handle,
      profile.headline,
      profile.summary,
      JSON.stringify(profile.skills),
      JSON.stringify(profile.rolePreferences),
      profile.availability,
      profile.location,
      profile.githubUrl,
      profile.resumeUrl,
      profile.portfolioUrl,
      profile.linkedinUrl,
      JSON.stringify(profile.socials),
      JSON.stringify(profile.evidence)
    ],
    value: BigInt(0)
  });

  await readClient.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.ACCEPTED
  });

  return { hash };
}

export async function submitOpportunityWrite(opportunity: OpportunityInput) {
  if (!env.opportunityRegistry) {
    throw new Error("Opportunity registry address is not configured.");
  }

  const readClient = createReadClient();
  const writeClient = await createWriteClient();

  const hash = await writeClient.writeContract({
    address: env.opportunityRegistry as `0x${string}`,
    functionName: "create_opportunity",
    args: [
      opportunity.title,
      opportunity.mission,
      opportunity.summary,
      JSON.stringify(opportunity.requiredSkills),
      opportunity.seniority,
      opportunity.commitment,
      opportunity.locationMode,
      opportunity.compensationText,
      JSON.stringify(opportunity.slots)
    ],
    value: BigInt(0)
  });

  await readClient.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.ACCEPTED
  });

  return { hash };
}

export async function getPersonalDashboardData(ownerAddress: string): Promise<PersonalDashboardData> {
  const normalizedOwner = ownerAddress.toLowerCase();
  const directProfiles = await readJson<OwnedProfile[]>(env.talentRegistry, "get_profiles_by_owner", [], [ownerAddress]);
  const profiles =
    directProfiles.length > 0
      ? directProfiles
      : (await readJson<OwnedProfile[]>(env.talentRegistry, "list_profiles", [])).filter(
          (profile) => profile.owner.toLowerCase() === normalizedOwner
        );

  const profilesWithMatches = await Promise.all(
    [...profiles]
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map(async (profile) => ({
        ...profile,
        matches: sortMatches(
          await readJson<MatchRecord[]>(env.matchingEngine, "list_matches_for_profile", [], [profile.profileId])
        )
      }))
  );

  return {
    walletAddress: ownerAddress,
    profiles: profilesWithMatches
  };
}

export async function getFounderDashboardData(ownerAddress: string): Promise<FounderDashboardData> {
  const normalizedOwner = ownerAddress.toLowerCase();
  const directOpportunities = await readJson<OwnedOpportunity[]>(
    env.opportunityRegistry,
    "get_opportunities_by_owner",
    [],
    [ownerAddress]
  );
  const opportunities =
    directOpportunities.length > 0
      ? directOpportunities
      : (await readJson<OwnedOpportunity[]>(env.opportunityRegistry, "list_opportunities", [])).filter(
          (opportunity) => opportunity.owner.toLowerCase() === normalizedOwner
        );

  const opportunitiesWithDetails = await Promise.all(
    [...opportunities]
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map(async (opportunity) => ({
        ...opportunity,
        matches: sortMatches(
          await readJson<MatchRecord[]>(
            env.matchingEngine,
            "list_matches_for_opportunity",
            [],
            [opportunity.opportunityId]
          )
        ),
        teamDraft: await readJson<TeamDraft | null>(
          env.teamFormation,
          "get_team_draft_by_opportunity",
          null,
          [opportunity.opportunityId]
        )
      }))
  );

  return {
    walletAddress: ownerAddress,
    opportunities: opportunitiesWithDetails
  };
}

export async function getProfileById(profileId: number) {
  return readJson<OwnedProfile | null>(env.talentRegistry, "get_profile", null, [profileId]);
}
