import { ollamaGenerate, extractJson } from "../ollama.js";
import { SoftwareArchitectOutputSchema } from "../types.js";
import type { BizEvaluatorOutput } from "../types.js";
import type { TheiaState } from "../state.js";

const buildPrompt = (biz: BizEvaluatorOutput) => `
Eres el Arquitecto de Software en una mesa de trabajo estratégica.

El Analista de Negocio acaba de presentar el producto a evaluar:

  Producto / Problema que resuelve: ${biz.problem_statement}
  Propuesta de valor: ${biz.value_proposition}
  ICP (cliente ideal): ${biz.icp}
  Pricing sugerido: ${biz.pricing_suggestion}
  Canales: ${biz.channels_recommended.join(", ")}

Tu trabajo es evaluar la viabilidad técnica y definir el enfoque de construcción del producto.
Responde directamente a lo que el Analista presentó.

Cubre:
- build_or_buy: para cada componente clave, ¿se construye desde cero, se integra un SaaS existente, o se usa open source?
- tech_stack: stack técnico recomendado (frontend, backend, infra, IA/ML si aplica)
- mvp_scope: qué incluye el MVP mínimo para validar el negocio (lista concreta de funcionalidades)
- architecture_approach: descripción en una frase del patrón arquitectónico (monolito modular, microservicios, serverless, etc.)
- estimated_team: roles y tamaño del equipo mínimo para construir el MVP
- estimated_time_to_mvp: estimación realista en semanas o meses para tener un MVP funcional
- technical_risks: riesgos técnicos principales (escalabilidad, deuda técnica, integraciones, etc.)
- existing_tools_to_evaluate: herramientas o plataformas existentes que el equipo debería evaluar antes de construir
- confidence: tu nivel de confianza en este análisis (0.0–1.0)

Responde ÚNICAMENTE con JSON válido. Sin texto extra, sin markdown, sin \`\`\`json.
{
  "agent_name": "software_architect",
  "build_or_buy": [
    { "component": "...", "decision": "build|buy|open-source", "rationale": "..." }
  ],
  "tech_stack": {
    "frontend": "...",
    "backend": "...",
    "infra": "...",
    "ai_ml": "..."
  },
  "mvp_scope": ["..."],
  "architecture_approach": "...",
  "estimated_team": ["..."],
  "estimated_time_to_mvp": "...",
  "technical_risks": ["..."],
  "existing_tools_to_evaluate": ["..."],
  "confidence": 0.0
}
`.trim();

export async function softwareArchitectNode(
  state: TheiaState
): Promise<Partial<TheiaState>> {
  console.log("\n🏗️   [Arquitecto de Software] Evaluando viabilidad técnica...");

  if (!state.bizOutput) throw new Error("bizOutput no disponible");

  const raw = await ollamaGenerate(buildPrompt(state.bizOutput));
  const parsed = SoftwareArchitectOutputSchema.parse(extractJson(raw));

  console.log(`   ✓ Arquitectura: ${parsed.architecture_approach}`);
  console.log(`   ✓ MVP en: ${parsed.estimated_time_to_mvp}`);
  console.log(`   ✓ Confianza: ${parsed.confidence}`);

  return {
    softwareArchitectOutput: parsed,
    tableMessages: [
      {
        agent: "software_architect",
        role: "Arquitecto de Software",
        timestamp: new Date().toISOString(),
        summary: `Arquitectura: ${parsed.architecture_approach} | MVP: ${parsed.estimated_time_to_mvp} | Stack: ${parsed.tech_stack.backend} + ${parsed.tech_stack.frontend} | Riesgos técnicos: ${parsed.technical_risks.length} | Confianza: ${parsed.confidence}`,
      },
    ],
  };
}
