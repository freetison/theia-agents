import { ollamaGenerate, extractJson } from "../ollama.js";
import { LegalExpertOutputSchema } from "../types.js";
import { loadPrompt } from "../config.js";
import type { TheiaState } from "../state.js";

export async function legalExpertNode(
  state: TheiaState
): Promise<Partial<TheiaState>> {
  console.log("\n⚖️   [Legal Expert] Analizando compliance y riesgos legales...");

  if (!state.bizOutput) throw new Error("bizOutput no disponible");
  if (!state.productOutput) throw new Error("productOutput no disponible");
  if (!state.marketingOutput) throw new Error("marketingOutput no disponible");

  const raw = await ollamaGenerate(loadPrompt("legal_expert", {
    BIZ_OUTPUT: JSON.stringify(state.bizOutput, null, 2),
    PRODUCT_OUTPUT: JSON.stringify(state.productOutput, null, 2),
    MARKETING_OUTPUT: JSON.stringify(state.marketingOutput, null, 2),
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
