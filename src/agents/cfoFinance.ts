import { llmGenerate, extractJson } from "../llm.js";
import { CFOFinanceOutputSchema } from "../types.js";
import { loadPrompt } from "../config.js";
import type { TheiaState } from "../state.js";

export async function cfoFinanceNode(
  state: TheiaState
): Promise<Partial<TheiaState>> {
  console.log("\n💰  [CFO Finance] Proyectando finanzas y unit economics...");

  if (!state.bizOutput) throw new Error("bizOutput no disponible");
  if (!state.productOutput) throw new Error("productOutput no disponible");
  if (!state.salesOutput) throw new Error("salesOutput no disponible");
  if (!state.marketingOutput) throw new Error("marketingOutput no disponible");

  const raw = await llmGenerate("cfo_finance", loadPrompt("cfo_finance", {
    BIZ_OUTPUT: JSON.stringify(state.bizOutput, null, 2),
    PRODUCT_OUTPUT: JSON.stringify(state.productOutput, null, 2),
    SALES_OUTPUT: JSON.stringify(state.salesOutput, null, 2),
    MARKETING_OUTPUT: JSON.stringify(state.marketingOutput, null, 2),
  }));
  const parsed = CFOFinanceOutputSchema.parse(extractJson(raw));

  console.log(`   ✓ LTV/CAC: ${parsed.unit_economics?.ltv_cac_ratio ?? "—"}`);
  console.log(`   ✓ Break-even: mes ${parsed.break_even?.months ?? "—"}`);
  console.log(`   ✓ Confianza: ${parsed.confidence}`);

  return {
    cfoOutput: parsed,
    tableMessages: [
      {
        agent: "cfo_finance",
        role: "CFO Finance",
        timestamp: new Date().toISOString(),
        summary: `LTV/CAC: ${parsed.unit_economics?.ltv_cac_ratio ?? "—"} | Break-even: mes ${parsed.break_even?.months ?? "—"} | ARR Y2: ${parsed.metrics_projection?.arr_year_2 ?? "—"} | Confianza: ${parsed.confidence}`,
      },
    ],
  };
}
