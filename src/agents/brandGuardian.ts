import { ollamaGenerate, extractJson } from "../ollama.js";
import { BrandGuardianOutputSchema } from "../types.js";
import type { BizEvaluatorOutput } from "../types.js";
import type { TheiaState } from "../state.js";

const buildPrompt = (biz: BizEvaluatorOutput) => `
Eres el Brand Guardian en una mesa de trabajo estratégica.

El Analista de Negocio acaba de presentar su análisis. Esto es lo que dijo:

  ICP: ${biz.icp}
  Problema: ${biz.problem_statement}
  Propuesta de valor: ${biz.value_proposition}
  Pricing: ${biz.pricing_suggestion}
  Canales: ${biz.channels_recommended.join(", ")}
  Riesgos: ${biz.risks.join("; ")}

Ahora te toca a ti. Responde directamente a lo que el Analista ha propuesto.
Tu trabajo: asegurarte de que el mensaje y la identidad de marca son coherentes, 
defendibles y consistentes con el posicionamiento B2B SaaS para España/LATAM.

Cubre:
- brand_tone: el tono de comunicación que mejor encaja
- key_messages: 3–5 mensajes clave para el mercado objetivo
- inconsistencies: incoherencias que detectas en el análisis del Analista
- recommendations: recomendaciones concretas para fortalecer la marca y el mensaje
- confidence: tu nivel de confianza (0.0–1.0)

Responde ÚNICAMENTE con JSON válido. Sin texto extra, sin markdown, sin \`\`\`json.
{
  "agent_name": "brand_guardian",
  "brand_tone": "...",
  "key_messages": ["..."],
  "inconsistencies": ["..."],
  "recommendations": ["..."],
  "confidence": 0.0
}
`.trim();

export async function brandGuardianNode(
  state: TheiaState
): Promise<Partial<TheiaState>> {
  console.log("\n🛡️   [Brand Guardian] Respondiendo al Analista...");

  if (!state.bizOutput) throw new Error("bizOutput no disponible");

  const raw = await ollamaGenerate(buildPrompt(state.bizOutput));
  const parsed = BrandGuardianOutputSchema.parse(extractJson(raw));

  console.log(`   ✓ Tono: ${parsed.brand_tone}`);
  console.log(`   ✓ Confianza: ${parsed.confidence}`);

  return {
    brandOutput: parsed,
    tableMessages: [
      {
        agent: "brand_guardian",
        role: "Brand Guardian",
        timestamp: new Date().toISOString(),
        summary: `Tono: ${parsed.brand_tone} | Mensajes: ${parsed.key_messages.slice(0, 2).join(" / ")} | Confianza: ${parsed.confidence}`,
      },
    ],
  };
}
