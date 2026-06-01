import { describe, it, expect } from 'vitest';
import { agentsCatalog } from './agents.catalog.js';

const EXPECTED_SLUGS = [
  'biz_evaluator',
  'software_architect',
  'product_manager',
  'brand_guardian',
  'growth_hacker',
  'marketing_strategist',
  'sales_lead',
  'cfo_finance',
  'legal_expert',
  'cxo_designer',
  'customer_success',
  'competitor_analyst',
  'synthesizer',
  'rental_specialist',
  'sourcing_specialist',
  'auto_orchestrator',
];

describe('agentsCatalog', () => {
  it('contains exactly 16 entries', () => {
    expect(agentsCatalog).toHaveLength(16);
  });

  it.each(EXPECTED_SLUGS)('includes slug "%s"', (slug) => {
    const found = agentsCatalog.some((a) => a.slug === slug);
    expect(found).toBe(true);
  });

  it('every entry has a non-empty displayName, description and icon', () => {
    for (const agent of agentsCatalog) {
      expect(agent.displayName.length).toBeGreaterThan(0);
      expect(agent.description.length).toBeGreaterThan(0);
      expect(agent.icon.length).toBeGreaterThan(0);
    }
  });

  it('slugs are unique', () => {
    const slugs = agentsCatalog.map((a) => a.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(agentsCatalog.length);
  });
});
