import { describe, it, expect } from 'vitest';
import { AgentsCatalogController } from './agents-catalog.controller';

describe('AgentsCatalogController', () => {
  const controller = new AgentsCatalogController();

  it('returns an array', () => {
    const result = controller.findAll();
    expect(Array.isArray(result)).toBe(true);
  });

  it('returns 13 agents', () => {
    const result = controller.findAll();
    expect(result).toHaveLength(13);
  });

  it('includes synthesizer slug', () => {
    const result = controller.findAll();
    const found = result.some((a) => a.slug === 'synthesizer');
    expect(found).toBe(true);
  });

  it('every agent has slug, displayName, description, icon', () => {
    const result = controller.findAll();
    for (const agent of result) {
      expect(typeof agent.slug).toBe('string');
      expect(typeof agent.displayName).toBe('string');
      expect(typeof agent.description).toBe('string');
      expect(typeof agent.icon).toBe('string');
    }
  });
});
