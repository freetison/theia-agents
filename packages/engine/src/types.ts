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

// ─── Helper: confidence — llama3.2 a veces omite el campo ────────────────────
const flexConfidence = z.preprocess((v) => {
  if (typeof v === "number") return Math.min(1, Math.max(0, v));
  if (typeof v === "string") return Math.min(1, Math.max(0, parseFloat(v) || 0.5));
  return 0.5;
}, z.number().min(0).max(1));

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
  db: flexString,
  infra: flexString,
  tools: flexString.optional(),
  ai_ml: flexString.optional(),
});

const ScalabilityTierSchema = z.object({
  range: flexString,
  approach: flexString,
});

const EffortEstimationSchema = z.object({
  mvp: flexString,
  three_months: flexString,
  six_months: flexString,
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
  effort_estimation: z.preprocess(
    (v) => (v !== null && typeof v === "object" ? v : {}),
    EffortEstimationSchema
  ),
  scalability_plan: z.preprocess(
    (v) => (Array.isArray(v) ? v : []),
    z.array(ScalabilityTierSchema)
  ),
  technical_risks: flexStringArray,
  existing_tools_to_evaluate: flexStringArray,
  confidence: flexConfidence,
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
  confidence: flexConfidence,
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
  confidence: flexConfidence,
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
  confidence: flexConfidence,
});
export type GrowthHackerOutput = z.infer<typeof GrowthHackerOutputSchema>;

// ─── Salida: Marketing Strategist ───────────────────────────────────────────
export const MarketingStrategistOutputSchema = z.object({
  agent_name: z.string().default("marketing_strategist"),
  positioning: flexString,
  target_audiences: z.preprocess((v) => (Array.isArray(v) ? v : []), z.array(z.any())),
  messaging_framework: z.any(),
  go_to_market: z.any(),
  content_strategy: z.any(),
  campaign_ideas: z.preprocess((v) => (Array.isArray(v) ? v : []), z.array(z.any())),
  budget_allocation: z.any(),
  risks: flexStringArray,
  assumptions: flexStringArray,
  confidence: flexConfidence,
});
export type MarketingStrategistOutput = z.infer<typeof MarketingStrategistOutputSchema>;

// ─── Salida: Product Manager ──────────────────────────────────────────────────
export const ProductManagerOutputSchema = z.object({
  agent_name: z.string().default("product_manager"),
  mvp_features: z.preprocess((v) => (Array.isArray(v) ? v : []), z.array(z.any())),
  roadmap_quarters: z.any(),
  user_stories: z.preprocess((v) => (Array.isArray(v) ? v : []), z.array(z.any())),
  success_metrics: z.any(),
  tradeoffs: flexStringArray,
  confidence: flexConfidence,
});
export type ProductManagerOutput = z.infer<typeof ProductManagerOutputSchema>;

// ─── Salida: Sales Lead ────────────────────────────────────────────────────────
export const SalesLeadOutputSchema = z.object({
  agent_name: z.string().default("sales_lead"),
  sales_strategy: z.any(),
  outbound_playbook: z.any(),
  inbound_tactics: z.preprocess((v) => (Array.isArray(v) ? v : []), z.array(z.any())),
  hiring_plan: z.preprocess((v) => (Array.isArray(v) ? v : []), z.array(z.any())),
  pipeline_projection: z.any(),
  sales_enablement: z.any(),
  confidence: flexConfidence,
});
export type SalesLeadOutput = z.infer<typeof SalesLeadOutputSchema>;

// ─── Salida: CFO Finance ───────────────────────────────────────────────────────
export const CFOFinanceOutputSchema = z.object({
  agent_name: z.string().default("cfo_finance"),
  projections_3yr: z.any(),
  unit_economics: z.any(),
  burn_rate_scenarios: z.any(),
  metrics_projection: z.any(),
  fundraising_plan: z.any(),
  break_even: z.any(),
  risks: flexStringArray,
  confidence: flexConfidence,
});
export type CFOFinanceOutput = z.infer<typeof CFOFinanceOutputSchema>;

// ─── Salida: Legal Expert ──────────────────────────────────────────────────────
export const LegalExpertOutputSchema = z.object({
  agent_name: z.string().default("legal_expert"),
  gdpr_obligations: z.preprocess((v) => (Array.isArray(v) ? v : []), z.array(z.any())),
  legal_documents: z.preprocess((v) => (Array.isArray(v) ? v : []), z.array(z.any())),
  compliance_requirements: z.preprocess((v) => (Array.isArray(v) ? v : []), z.array(z.any())),
  ip_risks: z.preprocess((v) => (Array.isArray(v) ? v : []), z.array(z.any())),
  data_residency: z.any(),
  launch_checklist: z.preprocess((v) => (Array.isArray(v) ? v : []), z.array(z.any())),
  risks: z.preprocess((v) => (Array.isArray(v) ? v : []), z.array(z.any())),
  confidence: flexConfidence,
});
export type LegalExpertOutput = z.infer<typeof LegalExpertOutputSchema>;

// ─── Salida: CXO Designer ──────────────────────────────────────────────────────
export const CXODesignerOutputSchema = z.object({
  agent_name: z.string().default("cxo_designer"),
  user_personas: z.preprocess((v) => (Array.isArray(v) ? v : []), z.array(z.any())),
  user_journey: z.any(),
  onboarding_flow: z.any(),
  information_architecture: z.any(),
  ux_research_plan: z.preprocess((v) => (Array.isArray(v) ? v : []), z.array(z.any())),
  accessibility: z.any(),
  risks: flexStringArray,
  confidence: flexConfidence,
});
export type CXODesignerOutput = z.infer<typeof CXODesignerOutputSchema>;

// ─── Salida: Customer Success ─────────────────────────────────────────────────
export const CustomerSuccessOutputSchema = z.object({
  agent_name: z.string().default("customer_success"),
  retention_strategy: z.any(),
  nps_program: z.any(),
  churn_reduction_playbook: z.any(),
  expansion_strategy: z.any(),
  metrics_projection: z.any(),
  cs_team_structure: z.preprocess((v) => (Array.isArray(v) ? v : []), z.array(z.any())),
  risks: flexStringArray,
  confidence: flexConfidence,
});
export type CustomerSuccessOutput = z.infer<typeof CustomerSuccessOutputSchema>;

// ─── Salida: Competitor Analyst ───────────────────────────────────────────────
export const CompetitorAnalystOutputSchema = z.object({
  agent_name: z.string().default("competitor_analyst"),
  competitors: z.preprocess((v) => (Array.isArray(v) ? v : []), z.array(z.any())),
  features_matrix: z.any(),
  pricing_analysis: z.any(),
  positioning_gaps: z.preprocess((v) => (Array.isArray(v) ? v : []), z.array(z.any())),
  swot: z.any(),
  battle_cards: z.preprocess((v) => (Array.isArray(v) ? v : []), z.array(z.any())),
  risks: flexStringArray,
  confidence: flexConfidence,
});
export type CompetitorAnalystOutput = z.infer<typeof CompetitorAnalystOutputSchema>;

// ─── Salida: Rental Specialist ────────────────────────────────────────────────
export const RentalSpecialistOutputSchema = z.object({
  agent_name: z.string().default("rental_specialist"),
  asset_category: flexString,
  ownership_model: flexString,
  utilization_target: flexString,
  avg_rental_duration: flexString,
  seasonal_pattern: flexString,
  asset_acquisition_cost: flexString,
  depreciation_years: flexString,
  maintenance_cost_pct: flexString,
  daily_rental_price: flexString,
  breakeven_days: flexString,
  gross_margin_pct: flexString,
  logistics_model: flexString,
  fleet_management: flexString,
  insurance_requirements: flexStringArray,
  local_competitors: flexStringArray,
  pricing_benchmark: flexString,
  differentiation: flexString,
  damage_risk: flexString,
  theft_risk: flexString,
  demand_volatility: flexString,
  asset_obsolescence: flexString,
  confidence: flexConfidence,
});
export type RentalSpecialistOutput = z.infer<typeof RentalSpecialistOutputSchema>;

// ─── Salida: Sourcing Specialist ──────────────────────────────────────────────
export const SourcingSpecialistOutputSchema = z.object({
  agent_name: z.string().default("sourcing_specialist"),
  product_to_source: flexString,
  product_specs: flexString,
  annual_volume_estimate: flexString,
  cn_suppliers: flexStringArray,
  cn_unit_cost_range: flexString,
  cn_moq: flexString,
  cn_lead_time: flexString,
  cn_total_landed_cost: flexString,
  eu_local_suppliers: flexStringArray,
  eu_unit_cost_range: flexString,
  eu_lead_time: flexString,
  eu_advantages: flexStringArray,
  cost_comparison: flexString,
  recommended_sourcing_mix: flexString,
  breakeven_volume: flexString,
  quality_risk_mitigation: flexString,
  incoterms_recommended: flexString,
  customs_duties: flexString,
  import_compliance: flexString,
  freight_options: flexString,
  supply_chain_risk: flexString,
  quality_risk: flexString,
  currency_risk: flexString,
  single_source_risk: flexString,
  confidence: flexConfidence,
});
export type SourcingSpecialistOutput = z.infer<typeof SourcingSpecialistOutputSchema>;

// ─── Salida: Auto Orchestrator ────────────────────────────────────────────────
const SkipAgentSchema = z.object({
  agent: flexString,
  reason: flexString,
});

export const AutoOrchestratorOutputSchema = z.object({
  agent_name: z.string().default("auto_orchestrator"),
  business_type: flexString,
  target_location: flexString,
  business_stage: flexString,
  primary_goal: flexString,
  top_agents: flexStringArray,
  skip_agents: z.preprocess((v) => (Array.isArray(v) ? v : []), z.array(SkipAgentSchema)),
  critical_questions: flexStringArray,
  recommended_profile: flexString,
  opportunity_signal: flexString,
  biggest_risk: flexString,
  unique_insight: flexString,
  confidence: flexConfidence,
});
export type AutoOrchestratorOutput = z.infer<typeof AutoOrchestratorOutputSchema>;

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
  confidence: flexConfidence,
});
export type FinalReport = z.infer<typeof FinalReportSchema>;
