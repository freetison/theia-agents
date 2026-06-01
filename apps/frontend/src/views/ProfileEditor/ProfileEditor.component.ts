import { defineComponent, ref, computed, inject, onMounted } from 'vue';
import { PROFILES_TOKEN } from '../../tokens/PROFILES_TOKEN';
import { HTTP_TOKEN } from '../../tokens/HTTP_TOKEN';
import type { ProfileDetail, CreateProfileInput, ProfileAgent } from '../../tokens/PROFILES_TOKEN';

interface AgentMeta {
  slug: string;
  displayName: string;
  description: string;
  icon: string;
}

export default defineComponent({
  name: 'ProfileEditor',

  setup() {
    const profilesService = inject(PROFILES_TOKEN);
    const http = inject(HTTP_TOKEN);

    const profiles = ref<ProfileDetail[]>([]);
    const agents = ref<AgentMeta[]>([]);
    const loading = ref(false);
    const saving = ref(false);
    const errorMsg = ref<string | null>(null);
    const successMsg = ref<string | null>(null);

    const formName = ref('');
    const formSlug = ref('');
    const formDescription = ref('');
    const selectedAgents = ref<string[]>([]);

    const existingSlugs = computed(() => profiles.value.map((p) => p.slug));

    const validationError = computed<string | null>(() => {
      if (!formName.value.trim()) return 'Name is required';
      if (!formSlug.value.trim()) return 'Slug is required';
      if (existingSlugs.value.includes(formSlug.value.trim())) return 'Slug already in use';
      if (selectedAgents.value.length === 0) return 'Select at least one agent';
      return null;
    });

    onMounted(async () => {
      loading.value = true;
      try {
        const [profilesData, agentsData] = await Promise.all([
          profilesService ? profilesService.findAll() : Promise.resolve([] as ProfileDetail[]),
          http ? http.get<AgentMeta[]>('/agents') : Promise.resolve([] as AgentMeta[]),
        ]);
        profiles.value = profilesData;
        agents.value = agentsData;
      } catch (e) {
        errorMsg.value = String(e);
      } finally {
        loading.value = false;
      }
    });

    function toggleAgent(slug: string): void {
      const idx = selectedAgents.value.indexOf(slug);
      if (idx >= 0) {
        selectedAgents.value = selectedAgents.value.filter((s) => s !== slug);
      } else {
        selectedAgents.value = [...selectedAgents.value, slug];
      }
    }

    function isAgentSelected(slug: string): boolean {
      return selectedAgents.value.includes(slug);
    }

    async function handleSubmit(): Promise<void> {
      if (validationError.value || !profilesService) return;
      saving.value = true;
      errorMsg.value = null;
      successMsg.value = null;
      try {
        const agentList: ProfileAgent[] = selectedAgents.value.map((agentId, idx) => ({
          agentId,
          sequence: idx + 1,
        }));
        const input: CreateProfileInput = {
          name: formName.value.trim(),
          slug: formSlug.value.trim(),
          description: formDescription.value.trim() || undefined,
          agents: agentList,
        };
        const created = await profilesService.create(input);
        profiles.value = [...profiles.value, created];
        formName.value = '';
        formSlug.value = '';
        formDescription.value = '';
        selectedAgents.value = [];
        successMsg.value = `Profile "${created.name}" created`;
      } catch (e) {
        errorMsg.value = String(e);
      } finally {
        saving.value = false;
      }
    }

    return {
      profiles,
      agents,
      loading,
      saving,
      errorMsg,
      successMsg,
      formName,
      formSlug,
      formDescription,
      selectedAgents,
      validationError,
      toggleAgent,
      isAgentSelected,
      handleSubmit,
    };
  },
});
