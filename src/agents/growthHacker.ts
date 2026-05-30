import { ollamaGenerate, extractJson } from "../ollama.js";
import { GrowthHackerOutputSchema } from "../types.js";
import type { BizEvaluatorOutput, BrandGuardianOutput } from "../types.js";
import type { TheiaState } from "../state.js";

const buildPrompt = (biz: BizEvaluatorOutput, brand: BrandGuardianOutput) => `
Eres el Growth Hacker en una mesa de trabajo estratégica.

El equipo ya ha hablado. Esto es lo que se ha dicho:

ANALISTA DE NEGOCIO:
  ICP: ${biz.icp}
  Propuesta de valor: ${biz.value_proposition}
  Canales propuestos: ${biz.channels_recommended.join(", ")}
  Pricing: ${biz.pricing_suggestion}

BRAND GUARDIAN (respondiendo al Analista):
  Tono de marca: ${brand.brand_tone}
  Mensajes clave: ${brand.key_messages.join(" | ")}
  Recomendaciones: ${brand.recommendations.join("; ")}

Ahora te toca a ti. Construye sobre todo lo anterior.
Tu trabajo: diseñar el plan de crecimiento concreto y ejecutable.

Cubre:
- funnel_stages: etapas del funnel (awareness → acción)
- experiments: 3–5 experimentos concretos, cada uno con nombre, objetivo, canal, pasos y KPI
- loops_virales: loops de referencia o viralidad si aplican
- kpi_key: KPIs principales para medir el éxito
- confidence: tu nivel de confianza (0.0–1.0)

Responde ÚNICAMENTE con JSON válido. Sin texto extra, sin markdown, sin \`\`\`json.
{
  "agent_name": "growth_hacker",
  "funnel_stages": ["..."],
  "experiments": [
    { "name": "...", "goal": "...", "channel": "...", "steps": ["..."], "kpi": "..." }
  ],
  "loops_virales": ["..."],
  "kpi_key": ["..."],
  "confidence": 0.0
}
`.trim();

export async function growthHackerNode(
  state: TheiaState
): Promise<Partial<TheiaState>> {
  console.log("\n🚀  [Growth Hacker] Construyendo sobre el análisis...");

  if (!state.bizOutput) throw new Error("bizOutput no disponible");
  if (!state.brandOutput) throw new Error("brandOutput no disponible");

  const raw = await ollamaGenerate(buildPrompt(state.bizOutput, state.brandOutput));
  const parsed = GrowthHackerOutputSchema.parse(extractJson(raw));

  console.log(`   ✓ Experimentos: ${parsed.experiments.length}`);
  console.log(`   ✓ Confianza: ${parsed.confidence}`);

  return {
    growthOutput: parsed,
    tableMessages: [
      {
        agent: "growth_hacker",
        role: "Growth Hacker",
        timestamp: new Date().toISOString(),
        summary: `Funnel: ${parsed.funnel_stages.join(" → ")} | ${parsed.experiments.length} experimentos | KPIs: ${parsed.kpi_key.slice(0, 2).join(", ")} | Confianza: ${parsed.confidence}`,
      },
    ],
  };
}
