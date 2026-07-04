export type ProfileTier = "Basic" | "Verified" | "EliteBuilder";
export type AutomationStage = "Submitted" | "Evaluating" | "Matches Ready";
export type JobKind = "profile-review" | "match-refresh" | "team-draft";

export type Profile = {
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
  tier: ProfileTier;
  reviewStatus: AutomationStage;
  version: number;
  updatedAt: number;
  reviewedAt: number;
};

export type OpportunitySlot = {
  slotKey: string;
  role: string;
  requiredSkills: string[];
};

export type Opportunity = {
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
  slots: OpportunitySlot[];
  status: "Active" | "Archived";
  version: number;
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
};

export type JobState = {
  key: string;
  kind: JobKind;
  attempts: number;
  lastRunAt: number;
  lastOutcome: "success" | "retry" | "error";
  message: string;
};
