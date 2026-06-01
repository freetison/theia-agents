import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ProfileEditor from './ProfileEditor.vue';
import { PROFILES_TOKEN } from '../../tokens/PROFILES_TOKEN';
import { HTTP_TOKEN } from '../../tokens/HTTP_TOKEN';
import type { ProfileDetail } from '../../tokens/PROFILES_TOKEN';

const stubProfiles: ProfileDetail[] = [
  { id: 'p-1', tenantId: 'tenant-1', name: 'Default', slug: 'default', agentCount: 5 },
];

const stubAgents = [
  { slug: 'biz_evaluator', displayName: 'Biz Evaluator', description: 'desc', icon: '📊' },
  { slug: 'software_architect', displayName: 'Software Architect', description: 'desc', icon: '🏗️' },
];

function makeMocks(profiles = stubProfiles) {
  const profilesService = {
    findAll: vi.fn().mockResolvedValue(profiles),
    create: vi.fn().mockResolvedValue({ id: 'p-new', tenantId: 'tenant-1', name: 'New', slug: 'new', agentCount: 1 }),
  };
  const http = {
    get: vi.fn().mockResolvedValue(stubAgents),
    post: vi.fn(),
  };
  return { profilesService, http };
}

describe('ProfileEditor', () => {
  it('renders existing profiles and agent checkboxes after mount', async () => {
    const { profilesService, http } = makeMocks();

    const wrapper = mount(ProfileEditor, {
      global: {
        provide: {
          [PROFILES_TOKEN as unknown as symbol]: profilesService,
          [HTTP_TOKEN as unknown as symbol]: http,
        },
      },
    });

    await new Promise((r) => setTimeout(r, 0));
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Default');
    expect(wrapper.text()).toContain('default');
    expect(wrapper.text()).toContain('Biz Evaluator');
  });

  it('shows validation error when submitting empty form', async () => {
    const { profilesService, http } = makeMocks();

    const wrapper = mount(ProfileEditor, {
      global: {
        provide: {
          [PROFILES_TOKEN as unknown as symbol]: profilesService,
          [HTTP_TOKEN as unknown as symbol]: http,
        },
      },
    });

    await new Promise((r) => setTimeout(r, 0));
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Name is required');
    const btn = wrapper.find('button[type="submit"]');
    expect((btn.element as HTMLButtonElement).disabled).toBe(true);
  });

  it('shows slug-in-use error when slug matches existing profile', async () => {
    const { profilesService, http } = makeMocks();

    const wrapper = mount(ProfileEditor, {
      global: {
        provide: {
          [PROFILES_TOKEN as unknown as symbol]: profilesService,
          [HTTP_TOKEN as unknown as symbol]: http,
        },
      },
    });

    await new Promise((r) => setTimeout(r, 0));
    await wrapper.vm.$nextTick();

    const vm = wrapper.vm as unknown as {
      formName: string;
      formSlug: string;
      selectedAgents: string[];
    };
    vm.formName = 'Copy';
    vm.formSlug = 'default';
    vm.selectedAgents = ['biz_evaluator'];

    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Slug already in use');
  });

  it('calls profilesService.create and shows success message on valid submit', async () => {
    const { profilesService, http } = makeMocks();

    const wrapper = mount(ProfileEditor, {
      global: {
        provide: {
          [PROFILES_TOKEN as unknown as symbol]: profilesService,
          [HTTP_TOKEN as unknown as symbol]: http,
        },
      },
    });

    await new Promise((r) => setTimeout(r, 0));
    await wrapper.vm.$nextTick();

    const vm = wrapper.vm as unknown as {
      formName: string;
      formSlug: string;
      selectedAgents: string[];
      handleSubmit: () => Promise<void>;
    };
    vm.formName = 'New Profile';
    vm.formSlug = 'new-profile';
    vm.selectedAgents = ['biz_evaluator'];

    await wrapper.vm.$nextTick();
    await vm.handleSubmit();
    await wrapper.vm.$nextTick();

    expect(profilesService.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New Profile', slug: 'new-profile' }),
    );
    expect(wrapper.text()).toContain('created');
  });
});
