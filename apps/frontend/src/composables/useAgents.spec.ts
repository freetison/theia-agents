import { describe, it, expect, vi } from 'vitest';
import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import { AGENTS_TOKEN } from '../tokens/AGENTS_TOKEN';
import type { IAgentsService, AgentStatus } from '../tokens/AGENTS_TOKEN';
import { ref } from 'vue';
import { useAgents } from './useAgents';

function makeMockService(overrides: Partial<IAgentsService> = {}): IAgentsService {
  return {
    agentStatuses: ref<AgentStatus[]>([]),
    sessionId: ref<string | null>(null),
    isRunning: ref(false),
    runAllAgents: vi.fn(),
    openProgressStream: vi.fn(),
    closeProgressStream: vi.fn(),
    ...overrides,
  };
}

describe('useAgents', () => {
  it('returns the injected IAgentsService', () => {
    const mock = makeMockService({
      agentStatuses: ref<AgentStatus[]>([{ name: 'biz_evaluator', status: 'idle' }]),
    });

    const Wrapper = defineComponent({
      setup() {
        const svc = useAgents();
        return { statuses: svc.agentStatuses };
      },
      template: '<div>{{ statuses.length }}</div>',
    });

    const wrapper = mount(Wrapper, {
      global: { provide: { [AGENTS_TOKEN as unknown as symbol]: mock } },
    });

    expect(wrapper.text()).toBe('1');
  });

  it('exposes isRunning reactive state', () => {
    const isRunning = ref(true);
    const mock = makeMockService({ isRunning });

    const Wrapper = defineComponent({
      setup() { return { running: useAgents().isRunning }; },
      template: '<span>{{ running }}</span>',
    });

    const wrapper = mount(Wrapper, {
      global: { provide: { [AGENTS_TOKEN as unknown as symbol]: mock } },
    });

    expect(wrapper.text()).toBe('true');
  });

  it('throws when AGENTS_TOKEN not provided', () => {
    const Wrapper = defineComponent({
      setup() { useAgents(); return {}; },
      template: '<div/>',
    });
    expect(() => mount(Wrapper)).toThrow();
  });
});
