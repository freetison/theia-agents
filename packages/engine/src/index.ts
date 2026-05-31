// ─── Public API of @theia/engine ─────────────────────────────────────────────
// Anything not exported here is internal and subject to change.

// Core orchestration
export { buildGraph } from "./graph.js";
export { GraphState, type TheiaState } from "./state.js";

// Profiles & config (disk-coupled — will be replaced by repos in plan V2)
export {
  loadProfile,
  listProfiles,
  type Profile,
  type AgentConfig,
} from "./profile.js";
export { loadProblem, loadPrompt, loadAgentConfig } from "./config.js";

// LLM layer
export { llmGenerate, extractJson } from "./llm.js";
export { registry } from "./providers/ProviderRegistry.js";
export type { IProvider } from "./providers/IProvider.js";

// Events (singleton — deprecated, will be replaced by per-session dispatcher)
export { theiaEvents, type AgentDoneEvent } from "./events.js";

// Session persistence helpers (CLI-only — will move to backend repos)
export {
  createSessionDir,
  setupSessionListeners,
  writeResultMd,
} from "./session.js";

// Schemas & types — re-exported via dedicated entry: import from "@theia/engine/schemas"
export * from "./types.js";
