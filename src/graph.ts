import { StateGraph, START, END } from "@langchain/langgraph";
import { GraphState } from "./state.js";
import type { TheiaState } from "./state.js";
import { theiaEvents } from "./events.js";
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

// ─── Wrapper: emite "agent:done" cuando el nodo termina ──────────────────────

type NodeFn = (state: TheiaState) => Promise<Partial<TheiaState>>;

function withEvent(fn: NodeFn): NodeFn {
  return async (state: TheiaState): Promise<Partial<TheiaState>> => {
    const result = await fn(state);
    const msg = result.tableMessages?.at(-1);
    if (msg) {
      theiaEvents.emit("agent:done", {
        agent: msg.agent,
        role: msg.role,
        timestamp: msg.timestamp,
        summary: msg.summary,
        data: result,
      });
    }
    return result;
  };
}

// ─── Mesa de trabajo (13 agentes) ────────────────────────────────────────────
//
//  START → biz_evaluator → brand_guardian → growth_hacker → software_architect
//        → marketing_strategist → product_manager → sales_lead → cfo_finance
//        → legal_expert → cxo_designer → customer_success → competitor_analyst
//        → synthesizer → END

export function buildGraph() {
  return new StateGraph(GraphState)
    .addNode("biz_evaluator", withEvent(bizEvaluatorNode))
    .addNode("brand_guardian", withEvent(brandGuardianNode))
    .addNode("growth_hacker", withEvent(growthHackerNode))
    .addNode("software_architect", withEvent(softwareArchitectNode))
    .addNode("marketing_strategist", withEvent(marketingStrategistNode))
    .addNode("product_manager", withEvent(productManagerNode))
    .addNode("sales_lead", withEvent(salesLeadNode))
    .addNode("cfo_finance", withEvent(cfoFinanceNode))
    .addNode("legal_expert", withEvent(legalExpertNode))
    .addNode("cxo_designer", withEvent(cxoDesignerNode))
    .addNode("customer_success", withEvent(customerSuccessNode))
    .addNode("competitor_analyst", withEvent(competitorAnalystNode))
    .addNode("synthesizer", withEvent(synthesizerNode))
    .addEdge(START, "biz_evaluator")
    .addEdge("biz_evaluator", "brand_guardian")
    .addEdge("brand_guardian", "growth_hacker")
    .addEdge("growth_hacker", "software_architect")
    .addEdge("software_architect", "marketing_strategist")
    .addEdge("marketing_strategist", "product_manager")
    .addEdge("product_manager", "sales_lead")
    .addEdge("sales_lead", "cfo_finance")
    .addEdge("cfo_finance", "legal_expert")
    .addEdge("legal_expert", "cxo_designer")
    .addEdge("cxo_designer", "customer_success")
    .addEdge("customer_success", "competitor_analyst")
    .addEdge("competitor_analyst", "synthesizer")
    .addEdge("synthesizer", END)
    .compile();
}

