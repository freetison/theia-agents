import { llmGenerate, extractJson } from "../llm.js";
import { FinalReportSchema } from "../types.js";
import { loadPrompt } from "../config.js";
import type { TheiaState } from "../state.js";

export async function synthesizerNode(
  state: TheiaState
): Promise<Partial<TheiaState>> {
  console.log("\n⚖️   [Facilitador] Sintetizando el veredicto final...");

  if (!state.bizOutput) throw new Error("bizOutput no disponible");
  if (!state.brandOutput) throw new Error("brandOutput no disponible");
  if (!state.growthOutput) throw new Error("growthOutput no disponible");
  if (!state.softwareArchitectOutput) throw new Error("softwareArchitectOutput no disponible");
  if (!state.marketingOutput) throw new Error("marketingOutput no disponible");
  if (!state.productOutput) throw new Error("productOutput no disponible");
  if (!state.salesOutput) throw new Error("salesOutput no disponible");
  if (!state.cfoOutput) throw new Error("cfoOutput no disponible");
  if (!state.legalOutput) throw new Error("legalOutput no disponible");
  if (!state.cxoOutput) throw new Error("cxoOutput no disponible");
  if (!state.csOutput) throw new Error("csOutput no disponible");
  if (!state.competitorOutput) throw new Error("competitorOutput no disponible");

  const raw = await llmGenerate("synthesizer", loadPrompt("synthesizer", {
    PROBLEM: state.problem,
    BIZ_OUTPUT: JSON.stringify(state.bizOutput, null, 2),
    BRAND_OUTPUT: JSON.stringify(state.brandOutput, null, 2),
    GROWTH_OUTPUT: JSON.stringify(state.growthOutput, null, 2),
    ARCH_OUTPUT: JSON.stringify(state.softwareArchitectOutput, null, 2),
    MARKETING_OUTPUT: JSON.stringify(state.marketingOutput, null, 2),
    PRODUCT_OUTPUT: JSON.stringify(state.productOutput, null, 2),
    SALES_OUTPUT: JSON.stringify(state.salesOutput, null, 2),
    CFO_OUTPUT: JSON.stringify(state.cfoOutput, null, 2),
    LEGAL_OUTPUT: JSON.stringify(state.legalOutput, null, 2),
    CXO_OUTPUT: JSON.stringify(state.cxoOutput, null, 2),
    CS_OUTPUT: JSON.stringify(state.csOutput, null, 2),
    COMPETITOR_OUTPUT: JSON.stringify(state.competitorOutput, null, 2),
  }));
  const parsed = FinalReportSchema.parse(extractJson(raw));

  console.log(`   ✓ Veredicto: ${parsed.verdict} (score: ${parsed.viability_score}/10)`);
  console.log(`   ✓ Confianza global: ${parsed.confidence}`);

  return {
    finalReport: parsed,
    tableMessages: [
      {
        agent: "synthesizer",
        role: "Facilitador",
        timestamp: new Date().toISOString(),
        summary: `VEREDICTO: ${parsed.verdict} | Score: ${parsed.viability_score}/10 | ${parsed.summary}`,
      },
    ],
  };
}
