import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { JobState } from "./types.js";

type PersistedState = {
  jobs: Record<string, JobState>;
  profileVersions: Record<string, number>;
  opportunityVersions: Record<string, number>;
};

const stateDir = path.resolve(".cache/agent-relayer");
const statePath = path.join(stateDir, "state.json");

function loadState(): PersistedState {
  mkdirSync(stateDir, { recursive: true });
  try {
    return JSON.parse(readFileSync(statePath, "utf8")) as PersistedState;
  } catch {
    return { jobs: {}, profileVersions: {}, opportunityVersions: {} };
  }
}

export class StateStore {
  private state = loadState();

  getJob(key: string): JobState | undefined {
    return this.state.jobs[key];
  }

  setJob(job: JobState) {
    this.state.jobs[job.key] = job;
    this.flush();
  }

  getProfileVersion(profileId: number) {
    return this.state.profileVersions[String(profileId)] ?? 0;
  }

  setProfileVersion(profileId: number, version: number) {
    this.state.profileVersions[String(profileId)] = version;
    this.flush();
  }

  getOpportunityVersion(opportunityId: number) {
    return this.state.opportunityVersions[String(opportunityId)] ?? 0;
  }

  setOpportunityVersion(opportunityId: number, version: number) {
    this.state.opportunityVersions[String(opportunityId)] = version;
    this.flush();
  }

  flush() {
    writeFileSync(statePath, `${JSON.stringify(this.state, null, 2)}\n`, "utf8");
  }
}
