import { llmGenerate, extractJson } from "../llm.js";
import { RentalSpecialistOutputSchema } from "../types.js";
import { loadPrompt } from "../config.js";
import type { TheiaState } from "../state.js";

export async function rentalSpecialistNode(
  state: TheiaState
): Promise<Partial<TheiaState>> {
  console.log("\n🔑  [Rental Specialist] Tomando la palabra...");

  const context = state.agentContext["rental_specialist"] ?? "";
  const raw = await llmGenerate(
    "rental_specialist",
    loadPrompt("rental_specialist", { PROBLEM: state.problem, CONTEXT: context })
  );
  const parsed = RentalSpecialistOutputSchema.parse(extractJson(raw));

  console.log(`   ✓ Asset: ${parsed.asset_category} | Confianza: ${parsed.confidence}`);

  return {
    rentalOutput: parsed,
    tableMessages: [
      {
        agent: "rental_specialist",
        role: "Rental Specialist",
        timestamp: new Date().toISOString(),
        summary: `Asset: ${parsed.asset_category} | Utilización objetivo: ${parsed.utilization_target} | Margen: ${parsed.gross_margin_pct} | Confianza: ${parsed.confidence}`,
      },
    ],
  };
}
