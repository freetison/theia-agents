import { ollamaGenerate, extractJson } from "../ollama.js";
import { CXODesignerOutputSchema } from "../types.js";
import { loadPrompt } from "../config.js";
import type { TheiaState } from "../state.js";

export async function cxoDesignerNode(
  state: TheiaState
): Promise<Partial<TheiaState>> {
  console.log("\n🎨  [CXO Designer] Diseñando UX, personas y onboarding...");

  if (!state.bizOutput) throw new Error("bizOutput no disponible");
  if (!state.productOutput) throw new Error("productOutput no disponible");
  if (!state.brandOutput) throw new Error("brandOutput no disponible");

  const raw = await ollamaGenerate(loadPrompt("cxo_designer", {
    BIZ_OUTPUT: JSON.stringify(state.bizOutput, null, 2),
    PRODUCT_OUTPUT: JSON.stringify(state.productOutput, null, 2),
    BRAND_OUTPUT: JSON.stringify(state.brandOutput, null, 2),
  }));
  const parsed = CXODesignerOutputSchema.parse(extractJson(raw));

  console.log(`   ✓ Personas: ${parsed.user_personas.length}`);
  console.log(`   ✓ Accessibility: ${parsed.accessibility?.standard ?? "—"}`);
  console.log(`   ✓ Confianza: ${parsed.confidence}`);

  return {
    cxoOutput: parsed,
    tableMessages: [
      {
        agent: "cxo_designer",
        role: "CXO Designer",
        timestamp: new Date().toISOString(),
        summary: `Personas: ${parsed.user_personas.length} | UX research plan: ${parsed.ux_research_plan.length} estudios | Confianza: ${parsed.confidence}`,
      },
    ],
  };
}
