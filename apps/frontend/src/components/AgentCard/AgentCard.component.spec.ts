import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AgentCard from './AgentCard.vue';

describe('AgentCard', () => {
  const baseProps = { agentName: 'biz_evaluator', status: 'idle' as const };

  it('renders agentName formatted as display name', () => {
    const w = mount(AgentCard, { props: baseProps });
    expect(w.text()).toContain('Biz Evaluator');
  });

  it('applies status CSS class', () => {
    const w = mount(AgentCard, { props: { ...baseProps, status: 'running' } });
    expect(w.find('[class*="card--running"]').exists()).toBe(true);
  });

  it('truncates summary to 10 words with ellipsis', () => {
    const long = 'one two three four five six seven eight nine ten eleven twelve';
    const w = mount(AgentCard, { props: { ...baseProps, summary: long } });
    expect(w.text()).toContain('one two three four five six seven eight nine ten…');
    expect(w.text()).not.toContain('eleven');
  });

  it('returns full summary when <= 10 words', () => {
    const short = 'one two three four five';
    const w = mount(AgentCard, { props: { ...baseProps, summary: short } });
    expect(w.text()).toContain(short);
  });

  it('emits retry event with agentName', async () => {
    const w = mount(AgentCard, { props: { ...baseProps, status: 'error', errorMessage: 'fail' } });
    const btn = w.find('[data-testid="retry-btn"]');
    if (btn.exists()) {
      await btn.trigger('click');
      expect(w.emitted('retry')).toBeTruthy();
      expect(w.emitted('retry')![0]).toEqual(['biz_evaluator']);
    }
  });
});
