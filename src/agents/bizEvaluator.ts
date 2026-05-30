import { ollamaGenerate, extractJson } from "../ollama.js";
import { BizEvaluatorOutputSchema } from "../types.js";
import type { TheiaState } from "../state.js";

const buildPrompt = (problem: string) => `
Eres el Analista de Negocio sentado en una mesa de trabajo estratégica.
Estás reunido con: Arquitecto de Software, Brand Guardian y Growth Hacker.
Eres el primero en hablar.

Problema / Oportunidad que el equipo debe evaluar:
${problem}

Contexto del producto:
- Theia Platform: plataforma B2B SaaS que simula equipos estratégicos completos.
- Mercado objetivo inicial: España y LATAM.

Tu análisis debe cubrir:
- ICP: perfil del cliente ideal
- Problem statement: el problema principal que se resuelve
- Value proposition: propuesta de valor clara y diferenciada
- Pricing suggestion: modelo y rango de precios
- Channels recommended: canales de venta con mayor probabilidad de éxito
- Risks: riesgos principales a monitorear
- Assumptions: supuestos clave del modelo
- Confidence: tu nivel de confianza (0.0–1.0)

Responde ÚNICAMENTE con JSON válido. Sin texto extra, sin markdown, sin \`\`\`json.
{
  "agent_name": "biz_evaluator",
  "icp": "...",
  "problem_statement": "...",
  "value_proposition": "...",
  "pricing_suggestion": "...",
  "channels_recommended": ["..."],
  "risks": ["..."],
  "confidence": 0.0,
  "assumptions": ["..."]
}
`.trim();

export async function bizEvaluatorNode(
  state: TheiaState
): Promise<Partial<TheiaState>> {
  console.log("\n🧑‍💼  [Analista de Negocio] Tomando la palabra...");

  const raw = await ollamaGenerate(buildPrompt(state.problem));
  const parsed = BizEvaluatorOutputSchema.parse(extractJson(raw));

  console.log(`   ✓ ICP: ${parsed.icp.slice(0, 80)}...`);
  console.log(`   ✓ Confianza: ${parsed.confidence}`);

  return {
    bizOutput: parsed,
    tableMessages: [
      {
        agent: "biz_evaluator",
        role: "Analista de Negocio",
        timestamp: new Date().toISOString(),
        summary: `ICP: ${parsed.icp} | VP: ${parsed.value_proposition} | Pricing: ${parsed.pricing_suggestion} | Confianza: ${parsed.confidence}`,
      },
    ],
  };
}
