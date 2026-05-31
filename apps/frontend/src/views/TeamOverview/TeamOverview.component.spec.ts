import { describe, it, expect, vi } from 'vitest';
import { defineComponent, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { AGENTS_TOKEN } from '../../tokens/AGENTS_TOKEN';
import type { IAgentsService, AgentStatus } from '../../tokens/AGENTS_TOKEN';
import TeamOverview from './TeamOverview.vue';

function makeMockService(overrides: Partial<IAgentsService> = {}): IAgentsService {
  return {
    agentStatuses: ref<AgentStatus[]>([
      { name: 'biz_evaluator', status: 'idle' },
    ]),
    sessionId: ref<string | null>(null),
    isRunning: ref(false),
    runAllAgents: vi.fn().mockResolvedValue(undefined),
    openProgressStream: vi.fn(),
    closeProgressStream: vi.fn(),
    ...overrides,
  };
}

describe('TeamOverview', () => {
  it('renders Run All Agents button', () => {
    const mock = makeMockService();
    const wrapper = mount(TeamOverview, {
      global: { provide: { [AGENTS_TOKEN as unknown as symbol]: mock } },
    });
    expect(wrapper.find('button').text()).toBe('Run All Agents');
  });

  it('button is disabled when isRunning is true', () => {
    const mock = makeMockService({ isRunning: ref(true) });
    const wrapper = mount(TeamOverview, {
      global: { provide: { [AGENTS_TOKEN as unknown as symbol]: mock } },
    });
    expect(wrapper.find('button').attributes('disabled')).toBeDefined();
  });

  it('button shows Running… text when isRunning', () => {
    const mock = makeMockService({ isRunning: ref(true) });
    const wrapper = mount(TeamOverview, {
      global: { provide: { [AGENTS_TOKEN as unknown as symbol]: mock } },
    });
    expect(wrapper.find('button').text()).toBe('Running…');
  });

  it('calls runAllAgents when button clicked', async () => {
    const runAllAgents = vi.fn().mockResolvedValue(undefined);
    const mock = makeMockService({ runAllAgents });
    const wrapper = mount(TeamOverview, {
      global: { provide: { [AGENTS_TOKEN as unknown as symbol]: mock } },
    });
    await wrapper.find('button').trigger('click');
    expect(runAllAgents).toHaveBeenCalledOnce();
  });
});
