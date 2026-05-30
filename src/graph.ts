import { StateGraph, START, END } from "@langchain/langgraph";
import { GraphState } from "./state.js";
import { bizEvaluatorNode } from "./agents/bizEvaluator.js";
import { softwareArchitectNode } from "./agents/softwareArchitect.js";
import { brandGuardianNode } from "./agents/brandGuardian.js";
import { growthHackerNode } from "./agents/growthHacker.js";
import { synthesizerNode } from "./agents/synthesizer.js";

// ─── Mesa de trabajo ─────────────────────────────────────────────────────────
//
//  START
//    │
//    ▼
//  biz_evaluator        → Analista de Negocio (habla primero)
//    │
//    ▼
//  software_architect   → Arquitecto de Software (evalúa cómo construirlo)
//    │
//    ▼
//  brand_guardian       → Brand Guardian (coherencia de marca y mensaje)
//    │
//    ▼
//  growth_hacker        → Growth Hacker (funnel, experimentos, KPIs)
//    │
//    ▼
//  synthesizer          → Facilitador (veredicto final)
//    │
//    ▼
//   END

export function buildGraph() {
  return new StateGraph(GraphState)
    .addNode("biz_evaluator", bizEvaluatorNode)
    .addNode("software_architect", softwareArchitectNode)
    .addNode("brand_guardian", brandGuardianNode)
    .addNode("growth_hacker", growthHackerNode)
    .addNode("synthesizer", synthesizerNode)
    .addEdge(START, "biz_evaluator")
    .addEdge("biz_evaluator", "software_architect")
    .addEdge("software_architect", "brand_guardian")
    .addEdge("brand_guardian", "growth_hacker")
    .addEdge("growth_hacker", "synthesizer")
    .addEdge("synthesizer", END)
    .compile();
}

