import { buildGraph } from "./graph.js";

const DEFAULT_PROBLEM = `
Evaluar el mercado B2B SaaS para Theia Platform en España y LATAM.
Necesito: ICP ideal, propuesta de valor, pricing sugerido, canales de venta recomendados,
y riesgos principales.
`.trim();

// Acepta el problema como argumento CLI: tsx src/main.ts "Mi idea de negocio aquí"
const problem = process.argv[2] ?? DEFAULT_PROBLEM;

async function main() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║      THEIA — Mesa de Trabajo Estratégica             ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  console.log(`\n📋 Problema:\n${problem}\n`);
  console.log("─".repeat(56));

  const graph = buildGraph();
  const result = await graph.invoke({ problem });

  // ─── Transcript de la mesa ────────────────────────────────────────────────
  console.log("\n\n📝  TRANSCRIPT DE LA MESA");
  console.log("─".repeat(56));
  for (const msg of result.tableMessages) {
    console.log(`\n[${msg.role.toUpperCase()}]  ${msg.timestamp}`);
    console.log(`   ${msg.summary}`);
  }

  // ─── Informe final ────────────────────────────────────────────────────────
  console.log("\n\n📊  INFORME EJECUTIVO FINAL");
  console.log("═".repeat(56));
  const r = result.finalReport!;
  console.log(`\n  VEREDICTO : ${r.verdict}`);
  console.log(`  SCORE     : ${r.viability_score}/10`);
  console.log(`  CONFIANZA : ${r.confidence}`);
  console.log(`\n  RESUMEN   : ${r.summary}`);
  console.log(`\n  Mercados recomendados : ${r.recommended_markets.join(", ")}`);
  console.log(`  Canales de lanzamiento: ${r.launch_channels.join(", ")}`);
  console.log(`  Presupuesto mínimo    : ${r.estimated_budget.minimum}`);
  console.log(`  Presupuesto recomendado: ${r.estimated_budget.recommended}`);
  console.log(`\n  Riesgos clave:`);
  for (const risk of r.key_risks) console.log(`    • ${risk}`);
  console.log(`\n  Próximos pasos:`);
  for (const step of r.next_steps) console.log(`    → ${step}`);

  console.log("\n\n🗂️   JSON COMPLETO:");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("\n❌ Error:", err);
  process.exit(1);
});
