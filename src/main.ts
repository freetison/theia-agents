import { buildGraph } from "./graph.js";
import { loadProblem } from "./config.js";
import { createSessionDir, writeSession } from "./session.js";

// Acepta el problema como argumento CLI: npm start "Mi idea de negocio aquí"
// Si no se pasa, lee config/problem.txt
const problem = process.argv[2] ?? loadProblem();

async function main() {
  const sessionDir = createSessionDir();

  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║      THEIA — Mesa de Trabajo Estratégica             ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  console.log(`\n📋 Problema:\n${problem}`);
  console.log(`📁 Sesión: ${sessionDir}\n`);
  console.log("─".repeat(56));

  const graph = buildGraph();
  const result = await graph.invoke({ problem });

  // ─── Guardar sesión en disco ───────────────────────────────────────────────
  writeSession(sessionDir, problem, result);

  // ─── Transcript de la mesa (consola) ─────────────────────────────────────
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
  console.log(`  CONFIANZA : ${Math.round(r.confidence * 100)}%`);
  console.log(`\n  RESUMEN   : ${r.summary}`);
  console.log(`\n  Mercados recomendados : ${r.recommended_markets.join(", ")}`);
  console.log(`  Canales de lanzamiento: ${r.launch_channels.join(", ")}`);
  console.log(`  Presupuesto mínimo    : ${r.estimated_budget.minimum}`);
  console.log(`  Presupuesto recomendado: ${r.estimated_budget.recommended}`);
  console.log(`\n  Riesgos clave:`);
  for (const risk of r.key_risks) console.log(`    • ${risk}`);
  console.log(`\n  Próximos pasos:`);
  for (const step of r.next_steps) console.log(`    → ${step}`);

  console.log(`\n\n📁  Sesión guardada en: ${sessionDir}`);
  console.log(`    result.md + ${result.tableMessages.length} archivos de agentes`);
}

main().catch((err) => {
  console.error("\n❌ Error:", err);
  process.exit(1);
});
