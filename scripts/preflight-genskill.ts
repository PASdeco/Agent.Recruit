import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const configPath = path.resolve("C:/Users/Hp/.codex/config.toml");
const brokenPath = "C:\\Vibe code\\genskill-mcp\\dist\\cli.js";
const fixedPath = "C:\\Vibecode\\genskill-mcp\\dist\\cli.js";

const current = readFileSync(configPath, "utf8");

if (!current.includes(fixedPath)) {
  const next = current.replace(brokenPath, fixedPath);
  if (next === current) {
    throw new Error("Unable to find the configured genskill MCP path to replace.");
  }
  writeFileSync(configPath, next, "utf8");
  console.log(`Updated genskill MCP path in ${configPath}`);
} else {
  console.log("genskill MCP path already points to the local Vibecode workspace.");
}
