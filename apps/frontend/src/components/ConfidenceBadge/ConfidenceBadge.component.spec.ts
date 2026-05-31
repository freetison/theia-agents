import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ConfidenceBadge from './ConfidenceBadge.vue';

describe('ConfidenceBadge', () => {
  it('shows LOW for confidence < 0.5', () => {
    const w = mount(ConfidenceBadge, { props: { confidence: 0.3 } });
    expect(w.text()).toContain('LOW');
    expect(w.find('[class*="badge--low"]').exists()).toBe(true);
  });

  it('shows MEDIUM for confidence < 0.7', () => {
    const w = mount(ConfidenceBadge, { props: { confidence: 0.6 } });
    expect(w.text()).toContain('MEDIUM');
    expect(w.find('[class*="badge--medium"]').exists()).toBe(true);
  });

  it('shows HIGH for confidence >= 0.7', () => {
    const w = mount(ConfidenceBadge, { props: { confidence: 0.9 } });
    expect(w.text()).toContain('HIGH');
    expect(w.find('[class*="badge--high"]').exists()).toBe(true);
  });

  it('shows exact boundary 0.5 as MEDIUM', () => {
    const w = mount(ConfidenceBadge, { props: { confidence: 0.5 } });
    expect(w.text()).toContain('MEDIUM');
  });

  it('shows exact boundary 0.7 as HIGH', () => {
    const w = mount(ConfidenceBadge, { props: { confidence: 0.7 } });
    expect(w.text()).toContain('HIGH');
  });
});
