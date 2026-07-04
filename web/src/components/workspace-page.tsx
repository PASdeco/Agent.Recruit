"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ActionBadge } from "@/components/action-badge";
import { StatusStrip } from "@/components/status-strip";
import { TransactionModal, type TransactionPhase } from "@/components/transaction-modal";
import { submitOpportunityWrite, submitProfileWrite } from "@/lib/genlayer";
import { truncateHash } from "@/lib/utils";

type Section = "talent" | "opportunities" | "matching" | "teams";

type OpportunityForm = {
  title: string;
  mission: string;
  summary: string;
  requiredSkills: string;
  seniority: string;
  commitment: string;
  locationMode: string;
  compensationText: string;
  slots: string;
};

const locationOptions = ["Remote", "Hybrid", "On-site"];
const availabilityOptions = ["Full time", "Part time", "Contract", "Freelance", "Advisory"];
const seniorityOptions = ["Junior", "Mid-level", "Senior", "Lead", "Principal"];

const fieldClassName =
  "rounded-[18px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] px-4 py-3.5 text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]";
const selectClassName = `${fieldClassName} appearance-none [color-scheme:dark]`;
const optionClassName = "bg-[#0f1512] text-white";
const emptyProfileForm = {
  handle: "",
  headline: "",
  summary: "",
  skills: "",
  rolePreferences: "",
  availability: "",
  location: "",
  githubUrl: "",
  resumeUrl: "",
  portfolioUrl: "",
  linkedinUrl: "",
  socialLinks: "",
  evidenceNotes: ""
};
const emptyOpportunityForm: OpportunityForm = {
  title: "",
  mission: "",
  summary: "",
  requiredSkills: "",
  seniority: "Senior",
  commitment: "Full time",
  locationMode: "Remote",
  compensationText: "",
  slots: ""
};

const deploymentCards = [
  {
    label: "Talent Registry",
    address: process.env.NEXT_PUBLIC_TALENT_REGISTRY_ADDRESS || ""
  },
  {
    label: "Opportunity Registry",
    address: process.env.NEXT_PUBLIC_OPPORTUNITY_REGISTRY_ADDRESS || ""
  },
  {
    label: "Matching Engine",
    address: process.env.NEXT_PUBLIC_MATCHING_ENGINE_ADDRESS || ""
  },
  {
    label: "Team Formation",
    address: process.env.NEXT_PUBLIC_TEAM_FORMATION_ADDRESS || ""
  }
].filter((item) => item.address);

function sectionHeading(section: Section) {
  switch (section) {
    case "talent":
      return {
        eyebrow: "Talent Registry",
        title: "Create an evidence-rich profile and submit it onchain.",
        copy: "Profile create and update flows are signed. Tier review is automated and relayer-submitted."
      };
    case "opportunities":
      return {
        eyebrow: "Opportunity Registry",
        title: "Publish role requirements that the network can evaluate against.",
        copy: "Opportunity writes are signed. Fit scoring and team assembly stay automated."
      };
    case "matching":
      return {
        eyebrow: "Matching Engine",
        title: "Focused-pair evaluation with live consensus-fit outcomes.",
        copy: "Refreshing a match is automated. The relayer drives the transaction, the UI reflects the result."
      };
    case "teams":
      return {
        eyebrow: "Team Formation",
        title: "Generate proactive draft teams from fresh score records.",
        copy: "Team generation can request missing pair scores behind the scenes before assigning the strongest fit."
      };
  }
}

function splitCommaValues(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function createSlotKey(role: string, index: number) {
  const cleaned = role
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned ? `${cleaned}-${index + 1}` : `slot-${index + 1}`;
}

function parseSlots(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const parts = line.split("|").map((part) => part.trim()).filter(Boolean);
      if (parts.length === 0) {
        return null;
      }
      if (parts.length === 1) {
        const role = parts[0];
        return { slotKey: createSlotKey(role, index), role, requiredSkills: [] as string[] };
      }
      if (parts.length === 2) {
        const [role, skillsText] = parts;
        return {
          slotKey: createSlotKey(role, index),
          role,
          requiredSkills: splitCommaValues(skillsText)
        };
      }

      const [slotKey, role, ...skillsParts] = parts;
      return {
        slotKey,
        role,
        requiredSkills: splitCommaValues(skillsParts.join(", "))
      };
    })
    .filter((item): item is { slotKey: string; role: string; requiredSkills: string[] } => Boolean(item));
}

function liveOutcomeCopy(section: Section) {
  switch (section) {
    case "talent":
      return {
        title: "Awaiting profile submission",
        body: "Your profile tier will appear here after the signed write is accepted and the relayer completes review."
      };
    case "opportunities":
      return {
        title: "Awaiting opportunity submission",
        body: "Posted opportunities will appear here after the signed write lands on Studionet."
      };
    case "matching":
      return {
        title: "No match outcome yet",
        body: "Submit at least one profile and one active opportunity first. The relayer will request matching automatically."
      };
    case "teams":
      return {
        title: "No team draft yet",
        body: "Team drafts are generated from accepted match records once the relayer has enough candidate data."
      };
  }
}

export function WorkspacePage({ section }: { section: Section }) {
  const [errorMessage, setErrorMessage] = useState("");
  const [phase, setPhase] = useState<TransactionPhase>("review");
  const [isModalOpen, setModalOpen] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [profileForm, setProfileForm] = useState(emptyProfileForm);
  const [opportunityForm, setOpportunityForm] = useState(emptyOpportunityForm);
  const heading = sectionHeading(section);
  const outcome = liveOutcomeCopy(section);

  const summary = useMemo(
    () =>
      section === "talent"
        ? [
            { label: "Network", value: process.env.NEXT_PUBLIC_GENLAYER_NETWORK || "studionet" },
            { label: "Action", value: "Create profile" },
            {
              label: "Evidence Pack",
              value:
                [
                  profileForm.githubUrl && "GitHub",
                  profileForm.resumeUrl && "Resume",
                  profileForm.portfolioUrl && "Portfolio",
                  profileForm.linkedinUrl && "LinkedIn",
                  profileForm.socialLinks.trim() && "Socials",
                  profileForm.evidenceNotes.trim() && "Additional proof"
                ]
                  .filter(Boolean)
                  .join(" · ") || "No links added yet"
            }
          ]
        : [
            { label: "Network", value: process.env.NEXT_PUBLIC_GENLAYER_NETWORK || "studionet" },
            { label: "Action", value: "Create opportunity" },
            { label: "Title", value: opportunityForm.title || "No title added yet" },
            {
              label: "Structure",
              value: [
                splitCommaValues(opportunityForm.requiredSkills).length > 0
                  ? `${splitCommaValues(opportunityForm.requiredSkills).length} required skills`
                  : "",
                parseSlots(opportunityForm.slots).length > 0 ? `${parseSlots(opportunityForm.slots).length} slots` : ""
              ]
                .filter(Boolean)
                .join(" · ") || "No opportunity details added yet"
            }
          ],
    [opportunityForm, profileForm, section]
  );

  function updateProfileField(field: keyof typeof profileForm, value: string) {
    setProfileForm((current) => ({ ...current, [field]: value }));
  }

  function updateOpportunityField(field: keyof OpportunityForm, value: string) {
    setOpportunityForm((current) => ({ ...current, [field]: value }));
  }

  async function openSignedFlow() {
    setErrorMessage("");
    setPhase("review");
    setModalOpen(true);
    const awaitingSignatureTimer = window.setTimeout(() => setPhase("awaiting-signature"), 250);

    try {
      if (section === "opportunities") {
        const requiredSkills = splitCommaValues(opportunityForm.requiredSkills);
        const slots = parseSlots(opportunityForm.slots);

        if (!opportunityForm.title || !opportunityForm.mission || !opportunityForm.summary) {
          throw new Error("Fill in the title, mission, and summary before posting an opportunity.");
        }

        if (requiredSkills.length === 0 || slots.length === 0) {
          throw new Error("Add required skills and at least one role slot before posting an opportunity.");
        }

        const result = await submitOpportunityWrite({
          title: opportunityForm.title,
          mission: opportunityForm.mission,
          summary: opportunityForm.summary,
          requiredSkills,
          seniority: opportunityForm.seniority,
          commitment: opportunityForm.commitment,
          locationMode: opportunityForm.locationMode,
          compensationText: opportunityForm.compensationText,
          slots
        });

        setTxHash(result.hash);
      } else {
        const parsedEvidence = profileForm.evidenceNotes
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean)
          .map((item) => {
            const [label, ...rest] = item.split(":");
            return {
              label: label?.trim() || "Evidence",
              value: rest.join(":").trim() || item
            };
          });

        if (
          !profileForm.handle ||
          !profileForm.headline ||
          !profileForm.summary ||
          !profileForm.availability ||
          !profileForm.location
        ) {
          throw new Error("Complete the required profile fields before creating the profile.");
        }

        const result = await submitProfileWrite({
          handle: profileForm.handle,
          headline: profileForm.headline,
          summary: profileForm.summary,
          skills: splitCommaValues(profileForm.skills),
          rolePreferences: splitCommaValues(profileForm.rolePreferences),
          availability: profileForm.availability,
          location: profileForm.location,
          githubUrl: profileForm.githubUrl,
          resumeUrl: profileForm.resumeUrl,
          portfolioUrl: profileForm.portfolioUrl,
          linkedinUrl: profileForm.linkedinUrl,
          socials: profileForm.socialLinks.split("\n").map((item) => item.trim()).filter(Boolean),
          evidence: parsedEvidence
        });

        setTxHash(result.hash);
      }

      window.clearTimeout(awaitingSignatureTimer);
      setPhase("broadcasting");
      window.setTimeout(() => setPhase("confirmed"), 1200);
    } catch (error) {
      window.clearTimeout(awaitingSignatureTimer);
      setErrorMessage(error instanceof Error ? error.message : "Transaction failed. Try again.");
      setPhase("failed");
    }
  }

  return (
    <>
      <section className="panel rounded-[30px] p-6 sm:p-8">
        <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">{heading.eyebrow}</p>
        <h1 className="mt-3 max-w-3xl font-[family:var(--font-display)] text-4xl tracking-[-0.05em] sm:text-5xl">
          {heading.title}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">{heading.copy}</p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="panel rounded-[28px] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Primary form</p>
              <h2 className="mt-2 text-2xl font-medium">
                {section === "opportunities" ? "Opportunity details" : "Profile details"}
              </h2>
            </div>
            <ActionBadge kind={section === "matching" || section === "teams" ? "automated" : "sign"} />
          </div>

          {section === "talent" ? (
            <div className="mt-6 grid gap-4">
              <label className="grid gap-2">
                <span className="text-base text-[var(--text-muted)]">Handle</span>
                <input
                  value={profileForm.handle}
                  onChange={(event) => updateProfileField("handle", event.target.value)}
                  autoComplete="off"
                  className={fieldClassName}
                />
              </label>
              <label className="grid gap-2">
                <span className="text-base text-[var(--text-muted)]">Headline</span>
                <input
                  value={profileForm.headline}
                  onChange={(event) => updateProfileField("headline", event.target.value)}
                  autoComplete="off"
                  className={fieldClassName}
                />
              </label>
              <label className="grid gap-2">
                <span className="text-base text-[var(--text-muted)]">Summary</span>
                <textarea
                  value={profileForm.summary}
                  onChange={(event) => updateProfileField("summary", event.target.value)}
                  rows={4}
                  autoComplete="off"
                  className={fieldClassName}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-base text-[var(--text-muted)]">Skills</span>
                  <input
                    value={profileForm.skills}
                    onChange={(event) => updateProfileField("skills", event.target.value)}
                    autoComplete="off"
                    placeholder="Type skills separated by commas"
                    className={fieldClassName}
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-base text-[var(--text-muted)]">Role Preferences</span>
                  <input
                    value={profileForm.rolePreferences}
                    onChange={(event) => updateProfileField("rolePreferences", event.target.value)}
                    autoComplete="off"
                    placeholder="Type role preferences separated by commas"
                    className={fieldClassName}
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-base text-[var(--text-muted)]">Availability</span>
                  <select
                    value={profileForm.availability}
                    onChange={(event) => updateProfileField("availability", event.target.value)}
                    className={selectClassName}
                  >
                    <option value="" disabled className={optionClassName}>
                      Select availability
                    </option>
                    {availabilityOptions.map((option) => (
                      <option key={option} value={option} className={optionClassName}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="text-base text-[var(--text-muted)]">Location</span>
                  <select
                    value={profileForm.location}
                    onChange={(event) => updateProfileField("location", event.target.value)}
                    className={selectClassName}
                  >
                    <option value="" disabled className={optionClassName}>
                      Select location
                    </option>
                    {locationOptions.map((option) => (
                      <option key={option} value={option} className={optionClassName}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="mt-2 rounded-[24px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Evidence Pack</p>
                    <h3 className="mt-2 text-xl font-medium">Proof links for validator review</h3>
                  </div>
                  <ActionBadge kind="sign" />
                </div>
                <p className="mt-3 text-base leading-8 text-[var(--text-muted)]">
                  GitHub, resume, socials, and supporting proof are part of the onchain profile payload that validators review for tiering and matching.
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-base text-[var(--text-muted)]">GitHub URL</span>
                    <input
                      value={profileForm.githubUrl}
                      onChange={(event) => updateProfileField("githubUrl", event.target.value)}
                      autoComplete="off"
                      className={fieldClassName}
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-base text-[var(--text-muted)]">Resume URL</span>
                    <input
                      value={profileForm.resumeUrl}
                      onChange={(event) => updateProfileField("resumeUrl", event.target.value)}
                      autoComplete="off"
                      className={fieldClassName}
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-base text-[var(--text-muted)]">Portfolio URL</span>
                    <input
                      value={profileForm.portfolioUrl}
                      onChange={(event) => updateProfileField("portfolioUrl", event.target.value)}
                      autoComplete="off"
                      className={fieldClassName}
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-base text-[var(--text-muted)]">LinkedIn URL</span>
                    <input
                      value={profileForm.linkedinUrl}
                      onChange={(event) => updateProfileField("linkedinUrl", event.target.value)}
                      autoComplete="off"
                      className={fieldClassName}
                    />
                  </label>
                </div>
                <div className="mt-4 grid gap-4">
                  <label className="grid gap-2">
                    <span className="text-base text-[var(--text-muted)]">Social Links</span>
                    <textarea
                      value={profileForm.socialLinks}
                      onChange={(event) => updateProfileField("socialLinks", event.target.value)}
                      rows={3}
                      autoComplete="off"
                      placeholder="One social link per line"
                      className={fieldClassName}
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-base text-[var(--text-muted)]">Additional Evidence</span>
                    <textarea
                      value={profileForm.evidenceNotes}
                      onChange={(event) => updateProfileField("evidenceNotes", event.target.value)}
                      rows={4}
                      autoComplete="off"
                      placeholder="Use one line per proof item, for example: HackathonWin: ETH Lagos finalist"
                      className={fieldClassName}
                    />
                  </label>
                </div>
              </div>
            </div>
          ) : null}

          {section === "opportunities" ? (
            <div className="mt-6 grid gap-4">
              <label className="grid gap-2">
                <span className="text-base text-[var(--text-muted)]">Title</span>
                <input
                  value={opportunityForm.title}
                  onChange={(event) => updateOpportunityField("title", event.target.value)}
                  autoComplete="off"
                  className={fieldClassName}
                />
              </label>
              <label className="grid gap-2">
                <span className="text-base text-[var(--text-muted)]">Mission</span>
                <input
                  value={opportunityForm.mission}
                  onChange={(event) => updateOpportunityField("mission", event.target.value)}
                  autoComplete="off"
                  className={fieldClassName}
                />
              </label>
              <label className="grid gap-2">
                <span className="text-base text-[var(--text-muted)]">Summary</span>
                <textarea
                  value={opportunityForm.summary}
                  onChange={(event) => updateOpportunityField("summary", event.target.value)}
                  rows={4}
                  autoComplete="off"
                  className={fieldClassName}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-base text-[var(--text-muted)]">Required Skills</span>
                  <input
                    value={opportunityForm.requiredSkills}
                    onChange={(event) => updateOpportunityField("requiredSkills", event.target.value)}
                    autoComplete="off"
                    placeholder="Type required skills separated by commas"
                    className={fieldClassName}
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-base text-[var(--text-muted)]">Compensation</span>
                  <input
                    value={opportunityForm.compensationText}
                    onChange={(event) => updateOpportunityField("compensationText", event.target.value)}
                    autoComplete="off"
                    placeholder="Example: Token + cash"
                    className={fieldClassName}
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="grid gap-2">
                  <span className="text-base text-[var(--text-muted)]">Seniority</span>
                  <select
                    value={opportunityForm.seniority}
                    onChange={(event) => updateOpportunityField("seniority", event.target.value)}
                    className={selectClassName}
                  >
                    {seniorityOptions.map((option) => (
                      <option key={option} value={option} className={optionClassName}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="text-base text-[var(--text-muted)]">Commitment</span>
                  <select
                    value={opportunityForm.commitment}
                    onChange={(event) => updateOpportunityField("commitment", event.target.value)}
                    className={selectClassName}
                  >
                    {availabilityOptions.map((option) => (
                      <option key={option} value={option} className={optionClassName}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="text-base text-[var(--text-muted)]">Location Mode</span>
                  <select
                    value={opportunityForm.locationMode}
                    onChange={(event) => updateOpportunityField("locationMode", event.target.value)}
                    className={selectClassName}
                  >
                    {locationOptions.map((option) => (
                      <option key={option} value={option} className={optionClassName}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="grid gap-2">
                <span className="text-base text-[var(--text-muted)]">Role Slots</span>
                <textarea
                  value={opportunityForm.slots}
                  onChange={(event) => updateOpportunityField("slots", event.target.value)}
                  rows={5}
                  autoComplete="off"
                  placeholder="One slot per line. Use: slot-key | Role Title | skill one, skill two"
                  className={fieldClassName}
                />
              </label>
            </div>
          ) : null}

          {section === "matching" ? (
            <div className="mt-6 rounded-[24px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] p-5">
              <p className="text-base text-[var(--text-muted)]">Focused pair status</p>
              <h3 className="mt-2 text-2xl font-medium">No pair has been evaluated yet</h3>
              <p className="mt-3 text-base leading-8 text-[var(--text-muted)]">
                Once profiles and opportunities exist onchain, the relayer can request pair evaluations and persist `MatchRecord` outcomes here.
              </p>
            </div>
          ) : null}

          {section === "teams" ? (
            <div className="mt-6 rounded-[24px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] p-5">
              <p className="text-base text-[var(--text-muted)]">Draft generation</p>
              <h3 className="mt-2 text-2xl font-medium">Team formation is relayer-managed</h3>
              <p className="mt-3 text-base leading-8 text-[var(--text-muted)]">
                Team drafts are generated from accepted match results after the relayer has enough candidate data for an opportunity.
              </p>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            {section === "talent" || section === "opportunities" ? (
              <button
                type="button"
                onClick={openSignedFlow}
                className="inline-flex items-center gap-3 rounded-full bg-[var(--accent-emerald)] px-5 py-3.5 text-base font-semibold text-[var(--bg-void)]"
              >
                {section === "opportunities" ? "Post Opportunity" : "Create Profile"}
                <ActionBadge kind="sign" />
              </button>
            ) : (
              <div className="inline-flex items-center gap-3 rounded-full border border-[var(--line-hairline)] px-5 py-3.5 text-base text-[var(--text-muted)]">
                Managed by relayer automation
                <ActionBadge kind="automated" />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel rounded-[28px] p-6 sm:p-8">
            <StatusStrip current="Evaluating" />
            <p className="mt-5 font-mono text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">Automation visibility</p>
            <div className="mt-4 space-y-4">
              <div className="rounded-[20px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">Studionet deployment</span>
                  <span className="font-mono text-sm text-[var(--text-muted)]">{deploymentCards.length}/4 live</span>
                </div>
                <div className="mt-3 grid gap-2">
                  {deploymentCards.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-3 rounded-[16px] border border-[var(--line-hairline)] px-3 py-2 text-sm">
                      <span className="text-[var(--text-muted)]">{item.label}</span>
                      <span className="font-mono text-[var(--text-primary)]">{truncateHash(item.address)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[20px] border border-[var(--line-hairline)] bg-[rgba(255,255,255,0.02)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">Relayer model</span>
                  <span className="font-mono text-sm text-[var(--text-muted)]">{process.env.NEXT_PUBLIC_GENLAYER_NETWORK || "studionet"}</span>
                </div>
                <p className="mt-2 text-base leading-7 text-[var(--text-muted)]">
                  Automated profile review, matching, and team generation are designed to run from the configured relayer environment after signed writes land onchain.
                </p>
              </div>
            </div>
          </div>

          <div className="panel rounded-[28px] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-medium">Live outcome</h2>
              <ActionBadge kind="automated" />
            </div>
            <div className="mt-5 rounded-[20px] border border-[var(--line-hairline)] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{outcome.title}</span>
                <span className="font-mono text-sm text-[var(--text-muted)]">Outcome only</span>
              </div>
              <p className="mt-3 text-base leading-8 text-[var(--text-muted)]">{outcome.body}</p>
            </div>
            <Link href="/" className="mt-5 inline-flex items-center gap-2 text-base text-[var(--text-muted)]">
              Return to overview
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <TransactionModal
        errorMessage={errorMessage}
        hash={txHash}
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        phase={phase}
        summary={summary}
      />
    </>
  );
}
