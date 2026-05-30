import { ollamaGenerate, extractJson } from "../ollama.js";
import { GrowthHackerOutputSchema } from "../types.js";
import { loadPrompt } from "../config.js";
import type { TheiaState } from "../state.js";

export async function growthHackerNode(
  state: TheiaState
): Promise<Partial<TheiaState>> {
  console.log("\n🚀  [Growth Hacker] Construyendo sobre el análisis...");

  if (!state.bizOutput) throw new Error("bizOutput no disponible");
  if (!state.brandOutput) throw new Error("brandOutput no disponible");

  const raw = await ollamaGenerate(loadPrompt("growth_hacker", {
    BIZ_ICP: state.bizOutput.icp,
    BIZ_VALUE_PROP: state.bizOutput.value_proposition,
    BIZ_CHANNELS: state.bizOutput.channels_recommended.join(", "),
    BIZ_PRICING: state.bizOutput.pricing_suggestion,
    BRAND_TONE: state.brandOutput.brand_tone,
    BRAND_MESSAGES: state.brandOutput.key_messages.join(" | "),
    BRAND_RECOMMENDATIONS: state.brandOutput.recommendations.join("; "),
  }));
  const parsed = GrowthHackerOutputSchema.parse(extractJson(raw));

  console.log(`   ✓ Experimentos: ${parsed.experiments.length}`);
  console.log(`   ✓ Confianza: ${parsed.confidence}`);

  return {
    growthOutput: parsed,
    tableMessages: [
      {
        agent: "growth_hacker",
        role: "Growth Hacker",
        timestamp: new Date().toISOString(),
        summary: `Funnel: ${parsed.funnel_stages.join(" → ")} | ${parsed.experiments.length} experimentos | KPIs: ${parsed.kpi_key.slice(0, 2).join(", ")} | Confianza: ${parsed.confidence}`,
      },
    ],
  };
}
