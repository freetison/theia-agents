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
};

describe('AgentDetail', () => {
  it('renders session data', async () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/sessions/:id', component: AgentDetail }],
    });
    await router.push(`/sessions/${mockSession.id}`);

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
});
