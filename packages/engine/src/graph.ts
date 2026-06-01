import { StateGraph, START, END } from "@langchain/langgraph";
import { GraphState } from "./state.js";
import type { TheiaState } from "./state.js";
import { theiaEvents } from "./events.js";
import type { Profile } from "./profile.js";
import { bizEvaluatorNode } from "./agents/bizEvaluator.js";
import { brandGuardianNode } from "./agents/brandGuardian.js";
import { growthHackerNode } from "./agents/growthHacker.js";
import { softwareArchitectNode } from "./agents/softwareArchitect.js";
import { marketingStrategistNode } from "./agents/marketingStrategist.js";
import { productManagerNode } from "./agents/productManager.js";
import { salesLeadNode } from "./agents/salesLead.js";
import { cfoFinanceNode } from "./agents/cfoFinance.js";
import { legalExpertNode } from "./agents/legalExpert.js";
import { cxoDesignerNode } from "./agents/cxoDesigner.js";
import { customerSuccessNode } from "./agents/customerSuccess.js";
import { competitorAnalystNode } from "./agents/competitorAnalyst.js";
import { synthesizerNode } from "./agents/synthesizer.js";
import { rentalSpecialistNode } from "./agents/rentalSpecialist.js";
import { sourcingSpecialistNode } from "./agents/sourcingSpecialist.js";
import { autoOrchestratorNode } from "./agents/autoOrchestrator.js";

// ─── Wrapper: emite "agent:start", "agent:done" o "agent:error" ───────────────

type NodeFn = (state: TheiaState) => Promise<Partial<TheiaState>>;

function withEvent(fn: NodeFn, sessionId?: string, sequence?: number): NodeFn {
  return async (state: TheiaState): Promise<Partial<TheiaState>> => {
    const agentName = fn.name || "unknown";
    theiaEvents.emit("agent:start", {
      sessionId,
      agent: agentName,
      sequence: sequence ?? 0,
      ts: new Date().toISOString(),
    });
    try {
      const result = await fn(state);
      const msg = result.tableMessages?.at(-1);
      if (msg) {
        theiaEvents.emit("agent:done", {
          sessionId,
          agent: msg.agent,
          role: msg.role,
          timestamp: msg.timestamp,
          summary: msg.summary,
          confidence: undefined,
          data: result,
        });
      }
      return result;
    } catch (e) {
      theiaEvents.emit("agent:error", {
        sessionId,
        agent: agentName,
        error: e instanceof Error ? e.message : String(e),
      });
      throw e;
    }
  };
}

// ─── Registry: todos los agentes disponibles ─────────────────────────────────

const NODE_REGISTRY: Record<string, NodeFn> = {
  biz_evaluator: bizEvaluatorNode,
  software_architect: softwareArchitectNode,
  product_manager: productManagerNode,
  brand_guardian: brandGuardianNode,
  growth_hacker: growthHackerNode,
  marketing_strategist: marketingStrategistNode,
  sales_lead: salesLeadNode,
  cfo_finance: cfoFinanceNode,
  legal_expert: legalExpertNode,
  cxo_designer: cxoDesignerNode,
  customer_success: customerSuccessNode,
  competitor_analyst: competitorAnalystNode,
  synthesizer: synthesizerNode,
  rental_specialist: rentalSpecialistNode,
  sourcing_specialist: sourcingSpecialistNode,
  auto_orchestrator: autoOrchestratorNode,
};

// ─── Construye el grafo dinámicamente según el perfil activo ─────────────────
//
//  Los agentes y su orden de ejecución vienen de profile.agents.
//  El grafo siempre termina en "synthesizer".

export function buildGraph(profile: Profile, sessionId?: string) {
  if (profile.agents.at(-1) !== "synthesizer") {
    throw new Error(`Profile "${profile.id}": last agent must be "synthesizer"`);
  }

  // StateGraph no tipea nodos dinámicos — cast necesario para construcción programática
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let g: any = new StateGraph(GraphState);

  for (let i = 0; i < profile.agents.length; i++) {
    const agentId = profile.agents[i];
    const fn = NODE_REGISTRY[agentId];
    if (!fn) throw new Error(`Unknown agent "${agentId}" in profile "${profile.id}"`);
    g = g.addNode(agentId, withEvent(fn, sessionId, i + 1));
  }

  g = g.addEdge(START, profile.agents[0]);
  for (let i = 0; i < profile.agents.length - 1; i++) {
    g = g.addEdge(profile.agents[i], profile.agents[i + 1]);
  }
  g = g.addEdge(profile.agents.at(-1)!, END);

  return g.compile();
}
