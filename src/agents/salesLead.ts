import { ollamaGenerate, extractJson } from "../ollama.js";
import { SalesLeadOutputSchema } from "../types.js";
import { loadPrompt } from "../config.js";
import type { TheiaState } from "../state.js";

export async function salesLeadNode(
  state: TheiaState
): Promise<Partial<TheiaState>> {
  console.log("\n💼  [Sales Lead] Definiendo estrategia de ventas...");

  if (!state.bizOutput) throw new Error("bizOutput no disponible");
  if (!state.growthOutput) throw new Error("growthOutput no disponible");
  if (!state.marketingOutput) throw new Error("marketingOutput no disponible");

  const raw = await ollamaGenerate(loadPrompt("sales_lead", {
    BIZ_OUTPUT: JSON.stringify(state.bizOutput, null, 2),
    GROWTH_OUTPUT: JSON.stringify(state.growthOutput, null, 2),
    MARKETING_OUTPUT: JSON.stringify(state.marketingOutput, null, 2),
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
