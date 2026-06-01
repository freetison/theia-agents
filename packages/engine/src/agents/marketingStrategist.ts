import { llmGenerate, extractJson } from "../llm.js";
import { MarketingStrategistOutputSchema } from "../types.js";
import { loadPrompt } from "../config.js";
import type { TheiaState } from "../state.js";

export async function marketingStrategistNode(
  state: TheiaState
): Promise<Partial<TheiaState>> {
  console.log("\n📣  [Marketing Strategist] Definiendo estrategia de marketing...");

  if (!state.bizOutput) throw new Error("bizOutput no disponible");

  const raw = await llmGenerate("marketing_strategist", loadPrompt("marketing_strategist", {
    BIZ_OUTPUT: state.bizOutput ? JSON.stringify(state.bizOutput, null, 2) : "N/A — agent not run in this profile",
    BRAND_OUTPUT: state.brandOutput ? JSON.stringify(state.brandOutput, null, 2) : "N/A — agent not run in this profile",
    GROWTH_OUTPUT: state.growthOutput ? JSON.stringify(state.growthOutput, null, 2) : "N/A — agent not run in this profile",
  }));
  const parsed = MarketingStrategistOutputSchema.parse(extractJson(raw));

  console.log(`   ✓ Positioning: ${parsed.positioning.slice(0, 80)}...`);
  console.log(`   ✓ Audiencias: ${parsed.target_audiences.length}`);
  console.log(`   ✓ Confianza: ${parsed.confidence}`);

  return {
    marketingOutput: parsed,
    tableMessages: [
      {
        agent: "marketing_strategist",
        role: "Marketing Strategist",
        timestamp: new Date().toISOString(),
        summary: `Positioning: ${parsed.positioning.slice(0, 60)} | Campañas: ${parsed.campaign_ideas.length} | Confianza: ${parsed.confidence}`,
      },
    ],
  };
}
