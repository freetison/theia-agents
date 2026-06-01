import { llmGenerate, extractJson } from "../llm.js";
import { AutoOrchestratorOutputSchema } from "../types.js";
import { loadPrompt } from "../config.js";
import type { TheiaState } from "../state.js";

export async function autoOrchestratorNode(
  state: TheiaState
): Promise<Partial<TheiaState>> {
  console.log("\n🧠  [Auto Orchestrator] Tomando la palabra...");

  const context = state.agentContext["auto_orchestrator"] ?? "";
  const raw = await llmGenerate(
    "auto_orchestrator",
    loadPrompt("auto_orchestrator", { PROBLEM: state.problem, CONTEXT: context })
  );
  const parsed = AutoOrchestratorOutputSchema.parse(extractJson(raw));

  console.log(`   ✓ Negocio: ${parsed.business_type} | Señal: ${parsed.opportunity_signal} | Confianza: ${parsed.confidence}`);

  return {
    autoOrchestratorOutput: parsed,
    tableMessages: [
      {
        agent: "auto_orchestrator",
        role: "Auto Orchestrator",
        timestamp: new Date().toISOString(),
        summary: `Tipo: ${parsed.business_type} | Ubicación: ${parsed.target_location} | Top agentes: ${parsed.top_agents.slice(0, 3).join(', ')} | Señal: ${parsed.opportunity_signal} | Confianza: ${parsed.confidence}`,
      },
    ],
  };
}
