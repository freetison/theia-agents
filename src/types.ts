import { z } from "zod";

// ─── Mensaje en la mesa ───────────────────────────────────────────────────────
export interface TableMessage {
  agent: string;
  role: string;
  timestamp: string;
  summary: string;
}

// ─── Helper: acepta string | object | number → siempre devuelve string ────────
// Los LLMs locales (llama3.2) a veces devuelven objetos anidados donde
// el schema espera un string. Este preprocess lo normaliza.
const flexString = z.preprocess((v) => {
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.join(", ");
  if (v !== null && typeof v === "object")
    return Object.entries(v as Record<string, unknown>)
      .map(([k, val]) => `${k}: ${val}`)
      .join(", ");
  return String(v ?? "");
}, z.string());

// ─── Helper: acepta string[] | string | object[] → siempre devuelve string[] ─
const flexStringArray = z.preprocess((v) => {
  if (Array.isArray(v))
    return v.map((item) =>
      typeof item === "string"
        ? item
        : typeof item === "object" && item !== null
        ? Object.entries(item as Record<string, unknown>)
            .map(([k, val]) => `${k}: ${val}`)
            .join(", ")
        : String(item)
    );
  if (typeof v === "string") return [v];
  return [];
}, z.array(z.string()));

// ─── Salida: Arquitecto de Software ──────────────────────────────────────────
const BuildOrBuyItemSchema = z.object({
  component: flexString,
  decision: z.preprocess(
    (v) => (typeof v === "string" ? v.toLowerCase().trim() : v),
    z.enum(["build", "buy", "open-source"])
  ),
  rationale: flexString,
});

const TechStackSchema = z.object({
  frontend: flexString,
  backend: flexString,
  infra: flexString,
  ai_ml: flexString.optional(),
});

export const SoftwareArchitectOutputSchema = z.object({
  agent_name: z.string().default("software_architect"),
  build_or_buy: z.preprocess(
    (v) => (Array.isArray(v) ? v : []),
    z.array(BuildOrBuyItemSchema)
  ),
  tech_stack: z.preprocess(
    (v) => (v !== null && typeof v === "object" ? v : {}),
    TechStackSchema
  ),
  mvp_scope: flexStringArray,
  architecture_approach: flexString,
  estimated_team: flexStringArray,
  estimated_time_to_mvp: flexString,
  technical_risks: flexStringArray,
  existing_tools_to_evaluate: flexStringArray,
  confidence: z.number().min(0).max(1),
});
export type SoftwareArchitectOutput = z.infer<typeof SoftwareArchitectOutputSchema>;

// ─── Salida: Analista de Negocio ──────────────────────────────────────────────
export const BizEvaluatorOutputSchema = z.object({
  agent_name: z.string().default("biz_evaluator"),
  icp: flexString,
  problem_statement: flexString,
  value_proposition: flexString,
  pricing_suggestion: flexString,
  channels_recommended: flexStringArray,
  risks: flexStringArray,
  confidence: z.number().min(0).max(1),
  assumptions: flexStringArray,
});
export type BizEvaluatorOutput = z.infer<typeof BizEvaluatorOutputSchema>;

// ─── Salida: Brand Guardian ───────────────────────────────────────────────────
export const BrandGuardianOutputSchema = z.object({
  agent_name: z.string().default("brand_guardian"),
  brand_tone: flexString,
  key_messages: flexStringArray,
  inconsistencies: flexStringArray,
  recommendations: flexStringArray,
  confidence: z.number().min(0).max(1),
});
export type BrandGuardianOutput = z.infer<typeof BrandGuardianOutputSchema>;

// ─── Salida: Growth Hacker ────────────────────────────────────────────────────
const ExperimentSchema = z.object({
  name: flexString,
  goal: flexString,
  channel: flexString,
  steps: flexStringArray,
  kpi: flexString,
});

export const GrowthHackerOutputSchema = z.object({
  agent_name: z.string().default("growth_hacker"),
  funnel_stages: flexStringArray,
  experiments: z.preprocess(
    (v) => (Array.isArray(v) ? v : []),
    z.array(ExperimentSchema)
  ),
  loops_virales: flexStringArray,
  kpi_key: flexStringArray,
  confidence: z.number().min(0).max(1),
});
export type GrowthHackerOutput = z.infer<typeof GrowthHackerOutputSchema>;

// ─── Salida: Synthesizer (Facilitador — veredicto final) ──────────────────────
export const FinalReportSchema = z.object({
  agent_name: z.string().default("synthesizer"),
  // El LLM puede escribir "go", "Go", "GO" — normalizar a mayúsculas
  verdict: z.preprocess(
    (v) => (typeof v === "string" ? v.toUpperCase().trim() : v),
    z.enum(["GO", "NO-GO", "CONDITIONAL"])
  ),
  viability_score: z.preprocess(
    (v) => (typeof v === "string" ? parseFloat(v) : v),
    z.number().min(0).max(10)
  ),
  recommended_markets: flexStringArray,
  launch_channels: flexStringArray,
  estimated_budget: z.preprocess(
    (v) => {
      if (v !== null && typeof v === "object") return v;
      return { minimum: String(v ?? "N/A"), recommended: String(v ?? "N/A") };
    },
    z.object({
      minimum: flexString,
      recommended: flexString,
    })
  ),
  key_risks: flexStringArray,
  next_steps: flexStringArray,
  summary: flexString,
  confidence: z.number().min(0).max(1),
});
export type FinalReport = z.infer<typeof FinalReportSchema>;
