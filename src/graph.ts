import { StateGraph, START, END } from "@langchain/langgraph";
import { GraphState } from "./state.js";
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

// ─── Mesa de trabajo (13 agentes) ────────────────────────────────────────────
//
//  START → biz_evaluator → brand_guardian → growth_hacker → software_architect
//        → marketing_strategist → product_manager → sales_lead → cfo_finance
//        → legal_expert → cxo_designer → customer_success → competitor_analyst
//        → synthesizer → END

export function buildGraph() {
  return new StateGraph(GraphState)
    .addNode("biz_evaluator", bizEvaluatorNode)
    .addNode("brand_guardian", brandGuardianNode)
    .addNode("growth_hacker", growthHackerNode)
    .addNode("software_architect", softwareArchitectNode)
    .addNode("marketing_strategist", marketingStrategistNode)
    .addNode("product_manager", productManagerNode)
    .addNode("sales_lead", salesLeadNode)
    .addNode("cfo_finance", cfoFinanceNode)
    .addNode("legal_expert", legalExpertNode)
    .addNode("cxo_designer", cxoDesignerNode)
    .addNode("customer_success", customerSuccessNode)
    .addNode("competitor_analyst", competitorAnalystNode)
    .addNode("synthesizer", synthesizerNode)
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

