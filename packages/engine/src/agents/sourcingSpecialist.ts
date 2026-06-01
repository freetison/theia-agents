import { llmGenerate, extractJson } from "../llm.js";
import { SourcingSpecialistOutputSchema } from "../types.js";
import { loadPrompt } from "../config.js";
import type { TheiaState } from "../state.js";

export async function sourcingSpecialistNode(
  state: TheiaState
): Promise<Partial<TheiaState>> {
  console.log("\n🌐  [Sourcing Specialist] Tomando la palabra...");

  const context = state.agentContext["sourcing_specialist"] ?? "";
  const raw = await llmGenerate(
    "sourcing_specialist",
    loadPrompt("sourcing_specialist", { PROBLEM: state.problem, CONTEXT: context })
  );
  const parsed = SourcingSpecialistOutputSchema.parse(extractJson(raw));

  console.log(`   ✓ Producto: ${parsed.product_to_source} | Mix: ${parsed.recommended_sourcing_mix} | Confianza: ${parsed.confidence}`);

  return {
    sourcingOutput: parsed,
    tableMessages: [
      {
        agent: "sourcing_specialist",
        role: "Sourcing Specialist",
        timestamp: new Date().toISOString(),
        summary: `Producto: ${parsed.product_to_source} | China: ${parsed.cn_unit_cost_range} | EU: ${parsed.eu_unit_cost_range} | Mix recomendado: ${parsed.recommended_sourcing_mix} | Confianza: ${parsed.confidence}`,
      },
    ],
  };
}
