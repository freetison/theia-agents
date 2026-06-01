import { llmGenerate, extractJson } from "../llm.js";
import { LegalExpertOutputSchema } from "../types.js";
import { loadPrompt } from "../config.js";
import type { TheiaState } from "../state.js";

export async function legalExpertNode(
  state: TheiaState
): Promise<Partial<TheiaState>> {
  console.log("\n⚖️   [Legal Expert] Analizando compliance y riesgos legales...");

  if (!state.bizOutput) throw new Error("bizOutput no disponible");

  const raw = await llmGenerate("legal_expert", loadPrompt("legal_expert", {
    BIZ_OUTPUT: state.bizOutput ? JSON.stringify(state.bizOutput, null, 2) : "N/A — agent not run in this profile",
    PRODUCT_OUTPUT: state.productOutput ? JSON.stringify(state.productOutput, null, 2) : "N/A — agent not run in this profile",
    MARKETING_OUTPUT: state.marketingOutput ? JSON.stringify(state.marketingOutput, null, 2) : "N/A — agent not run in this profile",
  }));
  const parsed = LegalExpertOutputSchema.parse(extractJson(raw));

  console.log(`   ✓ Obligaciones GDPR: ${parsed.gdpr_obligations.length}`);
  console.log(`   ✓ Documentos legales: ${parsed.legal_documents.length}`);
  console.log(`   ✓ Confianza: ${parsed.confidence}`);

  return {
    legalOutput: parsed,
    tableMessages: [
      {
        agent: "legal_expert",
        role: "Legal Expert",
        timestamp: new Date().toISOString(),
        summary: `GDPR: ${parsed.gdpr_obligations.length} obligaciones | Docs: ${parsed.legal_documents.length} | Riesgos: ${parsed.risks.length} | Confianza: ${parsed.confidence}`,
      },
    ],
  };
}
