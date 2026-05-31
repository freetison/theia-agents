import { llmGenerate, extractJson } from "../llm.js";
import { BrandGuardianOutputSchema } from "../types.js";
import { loadPrompt } from "../config.js";
import type { TheiaState } from "../state.js";

export async function brandGuardianNode(
  state: TheiaState
): Promise<Partial<TheiaState>> {
  console.log("\n🛡️   [Brand Guardian] Respondiendo al Analista...");

  if (!state.bizOutput) throw new Error("bizOutput no disponible");

  const raw = await llmGenerate("brand_guardian", loadPrompt("brand_guardian", {
    BIZ_ICP: state.bizOutput.icp,
    BIZ_PROBLEM_STATEMENT: state.bizOutput.problem_statement,
    BIZ_VALUE_PROP: state.bizOutput.value_proposition,
    BIZ_PRICING: state.bizOutput.pricing_suggestion,
    BIZ_CHANNELS: state.bizOutput.channels_recommended.join(", "),
    BIZ_RISKS: state.bizOutput.risks.join("; "),
  }));
  const parsed = BrandGuardianOutputSchema.parse(extractJson(raw));

  console.log(`   ✓ Tono: ${parsed.brand_tone}`);
  console.log(`   ✓ Confianza: ${parsed.confidence}`);

  return {
    brandOutput: parsed,
    tableMessages: [
      {
        agent: "brand_guardian",
        role: "Brand Guardian",
        timestamp: new Date().toISOString(),
        summary: `Tono: ${parsed.brand_tone} | Mensajes: ${parsed.key_messages.slice(0, 2).join(" / ")} | Confianza: ${parsed.confidence}`,
      },
    ],
  };
}
