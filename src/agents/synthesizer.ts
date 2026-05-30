import { ollamaGenerate, extractJson } from "../ollama.js";
import { FinalReportSchema } from "../types.js";
import type { TheiaState } from "../state.js";

const buildPrompt = (state: TheiaState) => `
Eres el Facilitador de la mesa de trabajo de Theia Platform.
Has escuchado a todos los agentes. Ahora produces el veredicto final.

El equipo evaluó este problema:
${state.problem}

─── LO QUE DIJO EL ANALISTA DE NEGOCIO ───
${JSON.stringify(state.bizOutput, null, 2)}

─── LO QUE DIJO EL ARQUITECTO DE SOFTWARE ───
${JSON.stringify(state.softwareArchitectOutput, null, 2)}

─── LO QUE DIJO EL BRAND GUARDIAN ───
${JSON.stringify(state.brandOutput, null, 2)}

─── LO QUE DIJO EL GROWTH HACKER ───
${JSON.stringify(state.growthOutput, null, 2)}

Tu tarea: sintetizar todo y producir el informe ejecutivo final.

Debes determinar:
- verdict: GO, NO-GO o CONDITIONAL
- viability_score: puntuación de viabilidad del 0 al 10
- recommended_markets: en qué mercados lanzar primero (con justificación breve)
- launch_channels: por qué canales lanzar (consolidando las recomendaciones del equipo)
- estimated_budget: presupuesto estimado en EUR/mes (minimum y recommended)
- key_risks: los riesgos más importantes que el equipo identificó
- next_steps: los 3–5 próximos pasos concretos y accionables
- summary: resumen ejecutivo de 2–3 frases para un CEO
- confidence: confianza global del informe (0.0–1.0)

Responde ÚNICAMENTE con JSON válido. Sin texto extra, sin markdown, sin \`\`\`json.
{
  "agent_name": "synthesizer",
  "verdict": "GO|NO-GO|CONDITIONAL",
  "viability_score": 0.0,
  "recommended_markets": ["..."],
  "launch_channels": ["..."],
  "estimated_budget": { "minimum": "...", "recommended": "..." },
  "key_risks": ["..."],
  "next_steps": ["..."],
  "summary": "...",
  "confidence": 0.0
}
`.trim();

export async function synthesizerNode(
  state: TheiaState
): Promise<Partial<TheiaState>> {
  console.log("\n⚖️   [Facilitador] Sintetizando el veredicto final...");

  if (!state.bizOutput) throw new Error("bizOutput no disponible");
  if (!state.softwareArchitectOutput) throw new Error("softwareArchitectOutput no disponible");
  if (!state.brandOutput) throw new Error("brandOutput no disponible");
  if (!state.growthOutput) throw new Error("growthOutput no disponible");

  const raw = await ollamaGenerate(buildPrompt(state));
  const parsed = FinalReportSchema.parse(extractJson(raw));

  console.log(`   ✓ Veredicto: ${parsed.verdict} (score: ${parsed.viability_score}/10)`);
  console.log(`   ✓ Confianza global: ${parsed.confidence}`);

  return {
    finalReport: parsed,
    tableMessages: [
      {
        agent: "synthesizer",
        role: "Facilitador",
        timestamp: new Date().toISOString(),
        summary: `VEREDICTO: ${parsed.verdict} | Score: ${parsed.viability_score}/10 | ${parsed.summary}`,
      },
    ],
  };
}
