import { Annotation } from "@langchain/langgraph";
import type {
  TableMessage,
  BizEvaluatorOutput,
  SoftwareArchitectOutput,
  BrandGuardianOutput,
  GrowthHackerOutput,
  MarketingStrategistOutput,
  ProductManagerOutput,
  SalesLeadOutput,
  CFOFinanceOutput,
  LegalExpertOutput,
  CXODesignerOutput,
  CustomerSuccessOutput,
  CompetitorAnalystOutput,
  RentalSpecialistOutput,
  SourcingSpecialistOutput,
  AutoOrchestratorOutput,
  FinalReport,
} from "./types.js";

// Estado compartido de la mesa de trabajo.
// Todos los agentes leen de aquí y escriben aquí.
export const GraphState = Annotation.Root({
  // El problema/oportunidad que se evalúa
  problem: Annotation<string>(),

  // Transcript de la mesa: cada agente "toma la palabra" y se registra aquí.
  // El reducer concatena — nunca sobreescribe.
  tableMessages: Annotation<TableMessage[]>({
    reducer: (existing: TableMessage[], incoming: TableMessage[]) => [
      ...existing,
      ...incoming,
    ],
    default: () => [],
  }),

  // Salidas estructuradas de cada agente (last-write-wins)
  bizOutput: Annotation<BizEvaluatorOutput | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  softwareArchitectOutput: Annotation<SoftwareArchitectOutput | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  brandOutput: Annotation<BrandGuardianOutput | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  growthOutput: Annotation<GrowthHackerOutput | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  marketingOutput: Annotation<MarketingStrategistOutput | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  productOutput: Annotation<ProductManagerOutput | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  salesOutput: Annotation<SalesLeadOutput | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  cfoOutput: Annotation<CFOFinanceOutput | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  legalOutput: Annotation<LegalExpertOutput | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  cxoOutput: Annotation<CXODesignerOutput | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  csOutput: Annotation<CustomerSuccessOutput | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  competitorOutput: Annotation<CompetitorAnalystOutput | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  rentalOutput: Annotation<RentalSpecialistOutput | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  sourcingOutput: Annotation<SourcingSpecialistOutput | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  autoOrchestratorOutput: Annotation<AutoOrchestratorOutput | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  // Veredicto final del facilitador
  finalReport: Annotation<FinalReport | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  // Perfil de negocio activo (determina qué agentes participan)
  profileId: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "it",
  }),
  profileName: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
  // Contexto por agente inyectado desde el perfil (sector-specific prompt context)
  agentContext: Annotation<Record<string, string>>({
    reducer: (_prev, next) => next,
    default: () => ({}),
  }),
});

export type TheiaState = typeof GraphState.State;
