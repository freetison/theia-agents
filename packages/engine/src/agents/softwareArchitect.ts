import { llmGenerate, extractJson } from "../llm.js";
import { SoftwareArchitectOutputSchema } from "../types.js";
import { loadPrompt } from "../config.js";
import type { TheiaState } from "../state.js";

export async function softwareArchitectNode(
  state: TheiaState
): Promise<Partial<TheiaState>> {
  console.log("\n🏗️   [Arquitecto de Software] Evaluando viabilidad técnica...");

  if (!state.bizOutput) throw new Error("bizOutput no disponible");

  const raw = await llmGenerate("software_architect", loadPrompt("software_architect", {
    BIZ_PROBLEM_STATEMENT: state.bizOutput.problem_statement,
    BIZ_VALUE_PROP: state.bizOutput.value_proposition,
    BIZ_ICP: state.bizOutput.icp,
    BIZ_PRICING: state.bizOutput.pricing_suggestion,
    BIZ_CHANNELS: state.bizOutput.channels_recommended.join(", "),
  }));
  const parsed = SoftwareArchitectOutputSchema.parse(extractJson(raw));

  console.log(`   ✓ Arquitectura: ${parsed.architecture_approach}`);
  console.log(`   ✓ MVP en: ${parsed.effort_estimation.mvp}`);
  console.log(`   ✓ Confianza: ${parsed.confidence}`);

  return {
    softwareArchitectOutput: parsed,
    tableMessages: [
      {
        agent: "software_architect",
        role: "Arquitecto de Software",
        timestamp: new Date().toISOString(),
        summary: `Arquitectura: ${parsed.architecture_approach} | MVP: ${parsed.effort_estimation.mvp} | Stack: ${parsed.tech_stack.backend} + ${parsed.tech_stack.frontend} | Riesgos técnicos: ${parsed.technical_risks.length} | Confianza: ${parsed.confidence}`,
      },
    ],
  };
}
