import { config as loadEnv } from "dotenv";
import { z } from "zod";
import { createAccount } from "genlayer-js";

loadEnv({ path: ".env.generated", override: false, quiet: true });
loadEnv({ path: ".env", override: false, quiet: true });
loadEnv({ path: ".env.local", override: true, quiet: true });

const envSchema = z.object({
  GENLAYER_RPC_URL: z.string().url().default("https://studio.genlayer.com/api"),
  GENLAYER_NETWORK: z.string().default("studionet"),
  RELAYER_ACCOUNT_ADDRESS: z.string().default(""),
  RELAYER_PRIVATE_KEY: z.string().default(""),
  RELAYER_LOOP_MS: z.coerce.number().int().positive().default(15000),
  TALENT_REGISTRY_ADDRESS: z.string().default(""),
  OPPORTUNITY_REGISTRY_ADDRESS: z.string().default(""),
  MATCHING_ENGINE_ADDRESS: z.string().default(""),
  TEAM_FORMATION_ADDRESS: z.string().default("")
});

export const relayerConfig = envSchema.parse(process.env);

if (relayerConfig.RELAYER_PRIVATE_KEY) {
  const derived = createAccount(relayerConfig.RELAYER_PRIVATE_KEY as `0x${string}`).address.toLowerCase();
  if (
    relayerConfig.RELAYER_ACCOUNT_ADDRESS &&
    relayerConfig.RELAYER_ACCOUNT_ADDRESS.toLowerCase() !== derived
  ) {
    throw new Error(
      `RELAYER_ACCOUNT_ADDRESS (${relayerConfig.RELAYER_ACCOUNT_ADDRESS}) does not match the provided RELAYER_PRIVATE_KEY (${derived}).`
    );
  }
}

export const relayerRuntime = {
  hasReadAddresses:
    Boolean(relayerConfig.TALENT_REGISTRY_ADDRESS) &&
    Boolean(relayerConfig.OPPORTUNITY_REGISTRY_ADDRESS) &&
    Boolean(relayerConfig.MATCHING_ENGINE_ADDRESS) &&
    Boolean(relayerConfig.TEAM_FORMATION_ADDRESS),
  hasWriteCredentials: Boolean(relayerConfig.RELAYER_PRIVATE_KEY)
};
