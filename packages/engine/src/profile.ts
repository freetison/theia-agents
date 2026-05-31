import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PROFILES_ROOT = join(ROOT, "profiles");

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface AgentConfig {
  /** Contexto extra que se inyecta en el prompt del agente (futuro uso). */
  context?: string;
}

export interface Profile {
  id: string;
  name: string;
  description: string;
  /**
   * Lista ordenada de agentes que participan en la mesa.
   * El último SIEMPRE debe ser "synthesizer".
   */
  agents: string[];
  /**
   * Configuración opcional por agente (contexto específico del sector).
   * Los agentes comunes reciben contexto diferente según el perfil.
   */
  agentConfig: Record<string, AgentConfig>;
}

// ─── Loader ──────────────────────────────────────────────────────────────────

export function loadProfile(id: string): Profile {
  const path = join(PROFILES_ROOT, `${id}.json`);
  let raw: string;
  try {
    raw = readFileSync(path, "utf-8");
  } catch {
    const available = listProfiles().join(", ");
    throw new Error(`Profile "${id}" not found. Available: ${available}`);
  }
  const profile = JSON.parse(raw) as Profile;

  if (!profile.agents || profile.agents.length < 2) {
    throw new Error(`Profile "${id}": must define at least 2 agents`);
  }
  if (profile.agents.at(-1) !== "synthesizer") {
    throw new Error(`Profile "${id}": last agent must be "synthesizer"`);
  }

  return profile;
}

export function listProfiles(): string[] {
  try {
    return readdirSync(PROFILES_ROOT)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""))
      .sort();
  } catch {
    return [];
  }
}
