import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { join, dirname } from "path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

interface AgentConfig {
  provider: string;
  model: string;
}

interface AgentsJson {
  default: AgentConfig;
  agents: Record<string, Partial<AgentConfig>>;
}

let agentsJson: AgentsJson | null = null;

function loadAgentsJson(): AgentsJson {
  if (!agentsJson) {
    agentsJson = JSON.parse(
      readFileSync(join(ROOT, "config", "agents.json"), "utf-8")
    ) as AgentsJson;
  }
  return agentsJson;
}

export function loadAgentConfig(agentName: string): AgentConfig {
  const cfg = loadAgentsJson();
  const override = cfg.agents[agentName] ?? {};
  return {
    provider: override.provider ?? cfg.default.provider,
    model: override.model ?? cfg.default.model,
  };
}

export function loadProblem(): string {
  return readFileSync(join(ROOT, "config", "problem.txt"), "utf-8").trim();
}

export function loadPrompt(agent: string, vars: Record<string, string>): string {
  const template = readFileSync(
    join(ROOT, "config", "prompts", `${agent}.txt`),
    "utf-8"
  ).trim();
  return Object.entries(vars).reduce(
    (acc, [key, val]) => acc.replaceAll(`{{${key}}}`, val),
    template
  );
}
