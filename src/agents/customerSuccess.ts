import { llmGenerate, extractJson } from "../llm.js";
import { CustomerSuccessOutputSchema } from "../types.js";
import { loadPrompt } from "../config.js";
import type { TheiaState } from "../state.js";

export async function customerSuccessNode(
  state: TheiaState
): Promise<Partial<TheiaState>> {
  console.log("\n🤝  [Customer Success] Definiendo estrategia de retención...");

  if (!state.bizOutput) throw new Error("bizOutput no disponible");
  if (!state.productOutput) throw new Error("productOutput no disponible");
  if (!state.cxoOutput) throw new Error("cxoOutput no disponible");
  if (!state.salesOutput) throw new Error("salesOutput no disponible");

  const raw = await llmGenerate("customer_success", loadPrompt("customer_success", {
    BIZ_OUTPUT: JSON.stringify(state.bizOutput, null, 2),
    PRODUCT_OUTPUT: JSON.stringify(state.productOutput, null, 2),
    CXO_OUTPUT: JSON.stringify(state.cxoOutput, null, 2),
    SALES_OUTPUT: JSON.stringify(state.salesOutput, null, 2),
  }));
  const parsed = CustomerSuccessOutputSchema.parse(extractJson(raw));

  console.log(`   ✓ Churn rate proyectado: ${parsed.metrics_projection?.churn_rate ?? "—"}`);
  console.log(`   ✓ NRR proyectado: ${parsed.metrics_projection?.nrr ?? "—"}`);
  console.log(`   ✓ Confianza: ${parsed.confidence}`);

  return {
    csOutput: parsed,
    tableMessages: [
      {
        agent: "customer_success",
        role: "Customer Success",
        timestamp: new Date().toISOString(),
        summary: `Churn: ${parsed.metrics_projection?.churn_rate ?? "—"} | NRR: ${parsed.metrics_projection?.nrr ?? "—"} | Team: ${parsed.cs_team_structure.length} roles | Confianza: ${parsed.confidence}`,
      },
    ],
  };
}
