import { describe, it, expect, vi } from 'vitest';
import { ref } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import { AGENTS_TOKEN } from '../../tokens/AGENTS_TOKEN';
import { PROFILES_TOKEN } from '../../tokens/PROFILES_TOKEN';
import type { IAgentsService, AgentStatus } from '../../tokens/AGENTS_TOKEN';
import type { IProfilesService, ProfileDetail } from '../../tokens/PROFILES_TOKEN';
import TeamOverview from './TeamOverview.vue';

const mockProfile: ProfileDetail = { id: 'p1', tenantId: null, name: 'Default', slug: 'default', agentCount: 3 };

function makeMockProfiles(profiles: ProfileDetail[] = [mockProfile]): IProfilesService {
  return {
    findAll: vi.fn().mockResolvedValue(profiles),
    create: vi.fn().mockResolvedValue(mockProfile),
  };
}

function makeMockService(overrides: Partial<IAgentsService> = {}): IAgentsService {
  return {
    agentStatuses: ref<AgentStatus[]>([{ name: 'biz_evaluator', status: 'idle' }]),
    sessionId: ref<string | null>(null),
    isRunning: ref(false),
    runAllAgents: vi.fn().mockResolvedValue(undefined),
    openProgressStream: vi.fn(),
    closeProgressStream: vi.fn(),
    ...overrides,
  };
}

function makeProvide(agentsMock: IAgentsService, profilesMock: IProfilesService) {
  return {
    [AGENTS_TOKEN as unknown as symbol]: agentsMock,
    [PROFILES_TOKEN as unknown as symbol]: profilesMock,
  };
}

describe('TeamOverview', () => {
  it('renders Run button', () => {
    const wrapper = mount(TeamOverview, {
      global: { provide: makeProvide(makeMockService(), makeMockProfiles()) },
    });
    expect(wrapper.find('button').text()).toBe('Run');
  });

  it('button is disabled when isRunning is true', () => {
    const wrapper = mount(TeamOverview, {
      global: { provide: makeProvide(makeMockService({ isRunning: ref(true) }), makeMockProfiles()) },
    });
    expect(wrapper.find('button').attributes('disabled')).toBeDefined();
  });

  it('button shows Running… text when isRunning', () => {
    const wrapper = mount(TeamOverview, {
      global: { provide: makeProvide(makeMockService({ isRunning: ref(true) }), makeMockProfiles()) },
    });
    expect(wrapper.find('button').text()).toBe('Running…');
  });

  it('calls runAllAgents when button clicked', async () => {
    const runAllAgents = vi.fn().mockResolvedValue(undefined);
    const wrapper = mount(TeamOverview, {
      global: { provide: makeProvide(makeMockService({ runAllAgents }), makeMockProfiles()) },
    });
    await flushPromises(); // let onMounted async resolve and set selectedProfileId
    await wrapper.find('button').trigger('click');
    expect(runAllAgents).toHaveBeenCalledOnce();
  });

  it('renders profile select element', () => {
    const wrapper = mount(TeamOverview, {
      global: { provide: makeProvide(makeMockService(), makeMockProfiles()) },
    });
    expect(wrapper.find('select#profile-select').exists()).toBe(true);
  });

  it('loads profiles on mount and populates select', async () => {
    const profilesMock = makeMockProfiles([mockProfile]);
    const wrapper = mount(TeamOverview, {
      global: { provide: makeProvide(makeMockService(), profilesMock) },
    });
    await flushPromises();
    expect(profilesMock.findAll).toHaveBeenCalledOnce();
    expect(wrapper.find('select#profile-select').findAll('option')).toHaveLength(1);
  });
});
