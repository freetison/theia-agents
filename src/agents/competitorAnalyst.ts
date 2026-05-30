import { llmGenerate, extractJson } from "../llm.js";
import { CompetitorAnalystOutputSchema } from "../types.js";
import { loadPrompt } from "../config.js";
import type { TheiaState } from "../state.js";

export async function competitorAnalystNode(
  state: TheiaState
): Promise<Partial<TheiaState>> {
  console.log("\n🔍  [Competitor Analyst] Analizando panorama competitivo...");

  if (!state.bizOutput) throw new Error("bizOutput no disponible");
  if (!state.marketingOutput) throw new Error("marketingOutput no disponible");
  if (!state.salesOutput) throw new Error("salesOutput no disponible");

  const raw = await llmGenerate("competitor_analyst", loadPrompt("competitor_analyst", {
    BIZ_OUTPUT: JSON.stringify(state.bizOutput, null, 2),
    MARKETING_OUTPUT: JSON.stringify(state.marketingOutput, null, 2),
    SALES_OUTPUT: JSON.stringify(state.salesOutput, null, 2),
  }));
  const parsed = CompetitorAnalystOutputSchema.parse(extractJson(raw));

  const direct = parsed.competitors.filter((c: any) => c.type === "direct").length;
  console.log(`   ✓ Competidores: ${parsed.competitors.length} (directos: ${direct})`);
  console.log(`   ✓ Gaps de posicionamiento: ${parsed.positioning_gaps.length}`);
  console.log(`   ✓ Confianza: ${parsed.confidence}`);

  return {
    competitorOutput: parsed,
    tableMessages: [
      {
        agent: "competitor_analyst",
        role: "Competitor Analyst",
        timestamp: new Date().toISOString(),
        summary: `Competidores: ${parsed.competitors.length} | Battle cards: ${parsed.battle_cards.length} | Gaps: ${parsed.positioning_gaps.length} | Confianza: ${parsed.confidence}`,
      },
    ],
  };
}
