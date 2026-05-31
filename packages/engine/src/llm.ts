import { loadAgentConfig } from "./config.js";
import { registry } from "./providers/ProviderRegistry.js";

export { extractJson } from "./ollama.js";

export async function llmGenerate(agentName: string, prompt: string): Promise<string> {
  const { provider, model } = loadAgentConfig(agentName);
  console.log(`   [llm] ${agentName} → ${provider}/${model}`);
  return registry.get(provider).generate(prompt, model);
}
