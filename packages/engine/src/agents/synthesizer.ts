import { llmGenerate, extractJson } from "../llm.js";
import { FinalReportSchema } from "../types.js";
import { loadPrompt } from "../config.js";
import type { TheiaState } from "../state.js";

const NA = "N/A — agent not included in this profile";

function orNA(val: unknown): string {
  return val ? JSON.stringify(val, null, 2) : NA;
}

export async function synthesizerNode(
  state: TheiaState
): Promise<Partial<TheiaState>> {
  console.log("\n⚖️   [Facilitador] Sintetizando el veredicto final...");

  if (!state.bizOutput) throw new Error("bizOutput no disponible");

  const raw = await llmGenerate("synthesizer", loadPrompt("synthesizer", {
    PROBLEM: state.problem,
    BIZ_OUTPUT: JSON.stringify(state.bizOutput, null, 2),
    BRAND_OUTPUT: orNA(state.brandOutput),
    GROWTH_OUTPUT: orNA(state.growthOutput),
    ARCH_OUTPUT: orNA(state.softwareArchitectOutput),
    MARKETING_OUTPUT: orNA(state.marketingOutput),
    PRODUCT_OUTPUT: orNA(state.productOutput),
    SALES_OUTPUT: orNA(state.salesOutput),
    CFO_OUTPUT: orNA(state.cfoOutput),
    LEGAL_OUTPUT: orNA(state.legalOutput),
    CXO_OUTPUT: orNA(state.cxoOutput),
    CS_OUTPUT: orNA(state.csOutput),
    COMPETITOR_OUTPUT: orNA(state.competitorOutput),
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
