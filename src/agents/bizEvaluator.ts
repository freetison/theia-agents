import { ollamaGenerate, extractJson } from "../ollama.js";
import { BizEvaluatorOutputSchema } from "../types.js";
import { loadPrompt } from "../config.js";
import type { TheiaState } from "../state.js";

export async function bizEvaluatorNode(
  state: TheiaState
): Promise<Partial<TheiaState>> {
  console.log("\n🧑‍💼  [Analista de Negocio] Tomando la palabra...");

  const raw = await ollamaGenerate(loadPrompt("biz_evaluator", { PROBLEM: state.problem }));
  const parsed = BizEvaluatorOutputSchema.parse(extractJson(raw));

  console.log(`   ✓ ICP: ${parsed.icp.slice(0, 80)}...`);
  console.log(`   ✓ Confianza: ${parsed.confidence}`);

  return {
    bizOutput: parsed,
    tableMessages: [
      {
        agent: "biz_evaluator",
        role: "Analista de Negocio",
        timestamp: new Date().toISOString(),
        summary: `ICP: ${parsed.icp} | VP: ${parsed.value_proposition} | Pricing: ${parsed.pricing_suggestion} | Confianza: ${parsed.confidence}`,
      },
    ],
  };
}
