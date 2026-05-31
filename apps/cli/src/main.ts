import {
  buildGraph,
  loadProblem,
  createSessionDir,
  setupSessionListeners,
  writeResultMd,
  loadProfile,
  listProfiles,
} from "@theia/engine";

// CLI: npm start "Mi idea de negocio aquí" [profile_id]
// Profiles disponibles: it, minorista, mayorista, alimenticio, servicios
const problem = process.argv[2] ?? loadProblem();
const profileId = process.argv[3] ?? "it";

async function main() {
  const profile = loadProfile(profileId);

  const agentContext = Object.fromEntries(
    Object.entries(profile.agentConfig).map(([k, v]) => [k, v.context ?? ""])
  );

  const sessionDir = createSessionDir();
  setupSessionListeners(sessionDir);

  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║      THEIA — Mesa de Trabajo Estratégica             ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  console.log(`\n🏷️  Perfil  : ${profile.name} (${profile.id})`);
  console.log(`🤖 Agentes : ${profile.agents.join(" → ")}`);
  console.log(`\n📋 Problema:\n${problem}`);
  console.log(`📁 Sesión  : ${sessionDir}\n`);
  console.log("─".repeat(56));

  const graph = buildGraph(profile);
  const result = await graph.invoke({ problem, profileId: profile.id, profileName: profile.name, agentContext });

  // ─── Guardar sesión en disco ───────────────────────────────────────────────
  if (result.finalReport) {
    writeResultMd(sessionDir, problem, result.finalReport, result.tableMessages);
  }

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
  console.log(`\n💡  Perfiles disponibles: ${listProfiles().join(", ")}`);
}

main().catch((err) => {
  console.error("\n❌ Error:", err);
  process.exit(1);
});
