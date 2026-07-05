import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

type DeploymentShape = {
  network: string;
  rpcUrl: string;
  relayerAddress?: string;
  contracts: {
    talentRegistry: string;
    opportunityRegistry: string;
    matchingEngine: string;
    teamFormation: string;
  };
};

const deploymentPath = path.resolve("deployments/studionet.json");
const webEnvPath = path.resolve("web/.env.local");
const relayerEnvPath = path.resolve("relayer/.env.generated");
const deployment = JSON.parse(readFileSync(deploymentPath, "utf8")) as DeploymentShape;

function readEnvFile(filePath: string) {
  try {
    return readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .reduce<Record<string, string>>((acc, line) => {
        const index = line.indexOf("=");
        if (index === -1) {
          return acc;
        }
        const key = line.slice(0, index).trim();
        const value = line.slice(index + 1);
        acc[key] = value;
        return acc;
      }, {});
  } catch {
    return {};
  }
}

const existingWebEnv = readEnvFile(webEnvPath);
const existingRelayerEnv = readEnvFile(relayerEnvPath);
const relayerAccountAddress =
  process.env.RELAYER_ACCOUNT_ADDRESS ||
  deployment.relayerAddress ||
  existingRelayerEnv.RELAYER_ACCOUNT_ADDRESS ||
  "";

const envLines = [
  `NEXT_PUBLIC_GENLAYER_NETWORK=${deployment.network}`,
  `NEXT_PUBLIC_GENLAYER_RPC_URL=${deployment.rpcUrl}`,
  `NEXT_PUBLIC_TALENT_REGISTRY_ADDRESS=${deployment.contracts.talentRegistry}`,
  `NEXT_PUBLIC_OPPORTUNITY_REGISTRY_ADDRESS=${deployment.contracts.opportunityRegistry}`,
  `NEXT_PUBLIC_MATCHING_ENGINE_ADDRESS=${deployment.contracts.matchingEngine}`,
  `NEXT_PUBLIC_TEAM_FORMATION_ADDRESS=${deployment.contracts.teamFormation}`,
  ...Object.entries(existingWebEnv)
    .filter(([key]) => !key.startsWith("NEXT_PUBLIC_"))
    .map(([key, value]) => `${key}=${value}`)
];

writeFileSync(webEnvPath, `${envLines.join("\n")}\n`, "utf8");
console.log(`Wrote ${webEnvPath}`);

const relayerLines = [
  `GENLAYER_NETWORK=${deployment.network}`,
  `GENLAYER_RPC_URL=${deployment.rpcUrl}`,
  `TALENT_REGISTRY_ADDRESS=${deployment.contracts.talentRegistry}`,
  `OPPORTUNITY_REGISTRY_ADDRESS=${deployment.contracts.opportunityRegistry}`,
  `MATCHING_ENGINE_ADDRESS=${deployment.contracts.matchingEngine}`,
  `TEAM_FORMATION_ADDRESS=${deployment.contracts.teamFormation}`,
  `RELAYER_ACCOUNT_ADDRESS=${relayerAccountAddress}`,
  "RELAYER_PRIVATE_KEY=",
  "RELAYER_LOOP_MS=15000"
];

writeFileSync(relayerEnvPath, `${relayerLines.join("\n")}\n`, "utf8");
console.log(`Wrote ${relayerEnvPath}`);
