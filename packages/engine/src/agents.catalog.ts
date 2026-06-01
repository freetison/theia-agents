// ─── Agents Catalog ───────────────────────────────────────────────────────────
// Static metadata for every agent known to the engine.
// This is the single source of truth for slugs used in profiles.

export interface AgentMeta {
  slug: string;
  displayName: string;
  description: string;
  icon: string;
}

export const agentsCatalog: AgentMeta[] = [
  {
    slug: 'biz_evaluator',
    displayName: 'Business Evaluator',
    description: 'Evaluates business viability, ICP, risks, and value proposition.',
    icon: '📊',
  },
  {
    slug: 'software_architect',
    displayName: 'Software Architect',
    description: 'Designs tech stack, build-vs-buy decisions, and scalability plan.',
    icon: '🏗️',
  },
  {
    slug: 'product_manager',
    displayName: 'Product Manager',
    description: 'Defines MVP features, roadmap quarters, and success metrics.',
    icon: '🗺️',
  },
  {
    slug: 'brand_guardian',
    displayName: 'Brand Guardian',
    description: 'Audits brand tone, key messages, and consistency.',
    icon: '🛡️',
  },
  {
    slug: 'growth_hacker',
    displayName: 'Growth Hacker',
    description: 'Designs viral loops, growth experiments, and funnel stages.',
    icon: '🚀',
  },
  {
    slug: 'marketing_strategist',
    displayName: 'Marketing Strategist',
    description: 'Defines positioning, target audiences, and go-to-market plan.',
    icon: '📣',
  },
  {
    slug: 'sales_lead',
    displayName: 'Sales Lead',
    description: 'Develops sales strategy, outbound playbook, and pipeline projection.',
    icon: '💼',
  },
  {
    slug: 'cfo_finance',
    displayName: 'CFO Finance',
    description: 'Models 3-year projections, unit economics, and burn rate scenarios.',
    icon: '💰',
  },
  {
    slug: 'legal_expert',
    displayName: 'Legal Expert',
    description: 'Identifies GDPR obligations, IP risks, and compliance requirements.',
    icon: '⚖️',
  },
  {
    slug: 'cxo_designer',
    displayName: 'CXO Designer',
    description: 'Maps user personas, journey, and information architecture.',
    icon: '🎨',
  },
  {
    slug: 'customer_success',
    displayName: 'Customer Success',
    description: 'Plans retention strategy, NPS program, and expansion playbook.',
    icon: '🤝',
  },
  {
    slug: 'competitor_analyst',
    displayName: 'Competitor Analyst',
    description: 'Maps competitors, pricing, positioning gaps, and SWOT.',
    icon: '🔍',
  },
  {
    slug: 'synthesizer',
    displayName: 'Synthesizer',
    description: 'Produces the final verdict (GO / NO-GO / CONDITIONAL) and viability score.',
    icon: '🧬',
  },
  {
    slug: 'rental_specialist',
    displayName: 'Rental Specialist',
    description: 'Analyses rental business models: utilization rates, depreciation, seasonal demand, and pricing for equipment, vehicles, or event assets.',
    icon: '🔑',
  },
  {
    slug: 'sourcing_specialist',
    displayName: 'Sourcing Specialist',
    description: 'Finds and compares global suppliers (China, EU, local) — unit cost, MOQ, lead time, shipping, customs — anchored to the target location in the prompt.',
    icon: '🌐',
  },
  {
    slug: 'auto_orchestrator',
    displayName: 'Auto Orchestrator',
    description: 'Reads the initial prompt, detects business category and context, and produces an agent routing plan with priority ranking and rationale.',
    icon: '🧠',
  },
];
