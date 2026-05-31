import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import SessionHistory from './SessionHistory.vue';
import { SESSIONS_TOKEN } from '../../tokens/SESSIONS_TOKEN';
import type { SessionSummary } from '../../tokens/SESSIONS_TOKEN';

const mockSessions: SessionSummary[] = [
  {
    id: 'aaaa-0001-0001-0001-aaaaaaaaaaaa',
    tenantId: 'tenant-1',
    profileId: 'prof-1',
    problem: 'Test problem',
    status: 'completed',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bbbb-0002-0002-0002-bbbbbbbbbbbb',
    tenantId: 'tenant-1',
    profileId: 'prof-1',
    problem: 'Another problem',
    status: 'running',
    createdAt: new Date().toISOString(),
  },
];

describe('SessionHistory', () => {
  it('renders session rows', async () => {
    const mock = {
      findAll: vi.fn().mockResolvedValue(mockSessions),
      findById: vi.fn(),
    };

    const wrapper = mount(SessionHistory, {
      global: { provide: { [SESSIONS_TOKEN as unknown as symbol]: mock } },
    });

    // wait for onMounted async call
    await new Promise((r) => setTimeout(r, 0));
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Test problem');
    expect(wrapper.text()).toContain('Another problem');
  });

  it('shows empty message when no sessions', async () => {
    const mock = { findAll: vi.fn().mockResolvedValue([]), findById: vi.fn() };
    const wrapper = mount(SessionHistory, {
      global: { provide: { [SESSIONS_TOKEN as unknown as symbol]: mock } },
    });

    await new Promise((r) => setTimeout(r, 0));
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('No sessions yet.');
  });
});
