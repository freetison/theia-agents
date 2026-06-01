import { llmGenerate, extractJson } from "../llm.js";
import { SalesLeadOutputSchema } from "../types.js";
import { loadPrompt } from "../config.js";
import type { TheiaState } from "../state.js";

export async function salesLeadNode(
  state: TheiaState
): Promise<Partial<TheiaState>> {
  console.log("\n💼  [Sales Lead] Definiendo estrategia de ventas...");

  if (!state.bizOutput) throw new Error("bizOutput no disponible");

  const raw = await llmGenerate("sales_lead", loadPrompt("sales_lead", {
    BIZ_OUTPUT: state.bizOutput ? JSON.stringify(state.bizOutput, null, 2) : "N/A — agent not run in this profile",
    GROWTH_OUTPUT: state.growthOutput ? JSON.stringify(state.growthOutput, null, 2) : "N/A — agent not run in this profile",
    MARKETING_OUTPUT: state.marketingOutput ? JSON.stringify(state.marketingOutput, null, 2) : "N/A — agent not run in this profile",
  }));
  const parsed = SalesLeadOutputSchema.parse(extractJson(raw));

  console.log(`   ✓ Modelo: ${parsed.sales_strategy?.model ?? "—"}`);
  console.log(`   ✓ Confianza: ${parsed.confidence}`);

  return {
    salesOutput: parsed,
    tableMessages: [
      {
        agent: "sales_lead",
        role: "Sales Lead",
        timestamp: new Date().toISOString(),
        summary: `Modelo: ${parsed.sales_strategy?.model ?? "—"} | Ratio out/in: ${parsed.sales_strategy?.outbound_inbound_ratio ?? "—"} | Confianza: ${parsed.confidence}`,
      },
    ],
  };
}
