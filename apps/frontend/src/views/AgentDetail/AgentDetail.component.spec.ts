import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import AgentDetail from './AgentDetail.vue';
import { SESSIONS_TOKEN } from '../../tokens/SESSIONS_TOKEN';
import type { SessionSummary } from '../../tokens/SESSIONS_TOKEN';

const mockSession: SessionSummary = {
  id: 'cccc-0003-0003-0003-cccccccccccc',
  tenantId: 'tenant-1',
  profileId: 'prof-1',
  problem: 'Detail problem',
  status: 'completed',
  createdAt: new Date().toISOString(),
  agentOutputs: [
    {
      id: 'out-1',
      sessionId: 'cccc-0003-0003-0003-cccccccccccc',
      agentId: 'biz_evaluator',
      sequence: 1,
      role: 'analyst',
      summary: 'Business looks viable',
      structuredOutput: { confidence: 0.85, icp: 'SMBs' },
      provider: 'ollama',
      model: 'llama3',
      latencyMs: 1200,
      tokensIn: 100,
      tokensOut: 200,
      costUsd: null,
      status: 'completed',
    },
  ],
};

function buildRouter(path: string) {
  const r = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/sessions/:id', component: AgentDetail },
      { path: '/sessions/:id/agents/:agentId', component: AgentDetail },
    ],
  });
  return { router: r, push: r.push(path) };
}

describe('AgentDetail', () => {
  it('renders session summary (no agentId in route)', async () => {
    const { router, push } = buildRouter(`/sessions/${mockSession.id}`);
    await push;
    const mock = {
      findAll: vi.fn(),
      findById: vi.fn().mockResolvedValue(mockSession),
    };
    const wrapper = mount(AgentDetail, {
      global: {
        plugins: [router],
        provide: { [SESSIONS_TOKEN as unknown as symbol]: mock },
      },
    });
    await new Promise((r) => setTimeout(r, 0));
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('completed');
    expect(wrapper.text()).toContain('Detail problem');
  });

  it('renders agent output when agentId is in route', async () => {
    const { router, push } = buildRouter(`/sessions/${mockSession.id}/agents/biz_evaluator`);
    await push;
    const mock = {
      findAll: vi.fn(),
      findById: vi.fn().mockResolvedValue(mockSession),
    };
    const wrapper = mount(AgentDetail, {
      global: {
        plugins: [router],
        provide: { [SESSIONS_TOKEN as unknown as symbol]: mock },
      },
    });
    await new Promise((r) => setTimeout(r, 0));
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('biz_evaluator');
    expect(wrapper.text()).toContain('Business looks viable');
    expect(wrapper.text()).toContain('85%');
  });

  it('shows error when agentId not found in session', async () => {
    const { router, push } = buildRouter(`/sessions/${mockSession.id}/agents/nonexistent`);
    await push;
    const mock = {
      findAll: vi.fn(),
      findById: vi.fn().mockResolvedValue(mockSession),
    };
    const wrapper = mount(AgentDetail, {
      global: {
        plugins: [router],
        provide: { [SESSIONS_TOKEN as unknown as symbol]: mock },
      },
    });
    await new Promise((r) => setTimeout(r, 0));
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('nonexistent');
    expect(wrapper.text()).toContain('not found');
  });
});

