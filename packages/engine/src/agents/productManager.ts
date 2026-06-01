import { llmGenerate, extractJson } from "../llm.js";
import { ProductManagerOutputSchema } from "../types.js";
import { loadPrompt } from "../config.js";
import type { TheiaState } from "../state.js";

export async function productManagerNode(
  state: TheiaState
): Promise<Partial<TheiaState>> {
  console.log("\n🗂️   [Product Manager] Definiendo roadmap y features...");

  if (!state.bizOutput) throw new Error("bizOutput no disponible");

  const raw = await llmGenerate("product_manager", loadPrompt("product_manager", {
    BIZ_OUTPUT: state.bizOutput ? JSON.stringify(state.bizOutput, null, 2) : "N/A — agent not run in this profile",
    BRAND_OUTPUT: state.brandOutput ? JSON.stringify(state.brandOutput, null, 2) : "N/A — agent not run in this profile",
    ARCH_OUTPUT: state.softwareArchitectOutput ? JSON.stringify(state.softwareArchitectOutput, null, 2) : "N/A — agent not run in this profile",
  }));
  const parsed = ProductManagerOutputSchema.parse(extractJson(raw));

  const p0Count = parsed.mvp_features.filter((f: any) => f.priority === "P0").length;
  console.log(`   ✓ Features MVP: ${parsed.mvp_features.length} (P0: ${p0Count})`);
  console.log(`   ✓ North Star: ${parsed.success_metrics?.north_star ?? "—"}`);
  console.log(`   ✓ Confianza: ${parsed.confidence}`);

  return {
    productOutput: parsed,
    tableMessages: [
      {
        agent: "product_manager",
        role: "Product Manager",
        timestamp: new Date().toISOString(),
        summary: `Features MVP: ${parsed.mvp_features.length} | North Star: ${parsed.success_metrics?.north_star ?? "—"} | Confianza: ${parsed.confidence}`,
      },
    ],
  };
}
