import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

type DeployResult = {
  address: string;
  txHash: string;
};

type DeploymentFile = {
  network: string;
  rpcUrl: string;
  explorerUrl: string;
  relayerAddress?: string;
  contracts: Record<string, string>;
};

const RPC_URL = "https://studio.genlayer.com/api";
const deploymentPath = path.resolve("deployments/studionet.json");
const genlayerCli = process.platform === "win32" ? "genlayer.cmd" : "genlayer";
const npmCli = process.platform === "win32" ? "npm.cmd" : "npm";
const current = JSON.parse(readFileSync(deploymentPath, "utf8")) as DeploymentFile;
const relayerAddress = process.env.RELAYER_ACCOUNT_ADDRESS || current.relayerAddress || "";

if (!/^0x[a-fA-F0-9]{40}$/.test(relayerAddress)) {
  throw new Error(
    "RELAYER_ACCOUNT_ADDRESS is required before Studionet deployment. Set it in the environment or deployments/studionet.json."
  );
}

const contracts = [
  { key: "talentRegistry", file: "contracts/talent_registry.py", args: [relayerAddress] },
  { key: "opportunityRegistry", file: "contracts/opportunity_registry.py", args: [] as string[] },
  { key: "matchingEngine", file: "contracts/matching_engine.py", args: [relayerAddress] },
  { key: "teamFormation", file: "contracts/team_formation.py", args: [relayerAddress] }
] as const;

function deployContract(contractPath: string, args: string[]): DeployResult {
  const output = execFileSync(
    genlayerCli,
    ["deploy", "--rpc", RPC_URL, "--contract", contractPath, ...(args.length > 0 ? ["--args", ...args] : [])],
    { encoding: "utf8", shell: process.platform === "win32" }
  );

  const addressMatch =
    output.match(/contractAddress['"]?\s*[:=]\s*['"]?(0x[a-fA-F0-9]{40})/i) ||
    output.match(/['"]?Contract Address['"]?\s*[:=]\s*['"]?(0x[a-fA-F0-9]{40})/i);
  const txMatch =
    output.match(/txHash['"]?\s*[:=]\s*['"]?(0x[a-fA-F0-9]+)/i) ||
    output.match(/['"]?Transaction Hash['"]?\s*[:=]\s*['"]?(0x[a-fA-F0-9]+)/i);

  if (!addressMatch || !txMatch) {
    throw new Error(`Could not parse deploy output for ${contractPath}.\n${output}`);
  }

  return { address: addressMatch[1], txHash: txMatch[1] };
}

current.relayerAddress = relayerAddress;

for (const contract of contracts) {
  const result = deployContract(contract.file, contract.args);
  current.contracts[contract.key] = result.address;
  console.log(`${contract.key}: ${result.address} (${result.txHash})`);
}

writeFileSync(deploymentPath, `${JSON.stringify(current, null, 2)}\n`, "utf8");
execFileSync(npmCli, ["run", "sync-env"], { stdio: "inherit", shell: process.platform === "win32" });
