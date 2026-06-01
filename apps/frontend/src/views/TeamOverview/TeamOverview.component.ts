import { defineComponent, ref, computed, inject, onMounted } from 'vue';
import { useAgents } from '../../composables/useAgents';
import { PROFILES_TOKEN } from '../../tokens/PROFILES_TOKEN';
import type { ProfileDetail } from '../../tokens/PROFILES_TOKEN';
import AgentCard from '../../components/AgentCard/AgentCard.vue';

export default defineComponent({
  name: 'TeamOverview',

  components: { AgentCard },

  setup() {
    const agentsService = useAgents();
    const profilesService = inject(PROFILES_TOKEN);

    const { agentStatuses, isRunning, sessionId } = agentsService;

    const profiles = ref<ProfileDetail[]>([]);
    const selectedProfileId = ref<string>('');
    const profilesError = ref<string | null>(null);

    onMounted(async () => {
      if (!profilesService) { profilesError.value = 'Profiles service not available'; return; }
      const result = await profilesService.findAll().catch(() => [] as ProfileDetail[]);
      profiles.value = result;
      const autoProfile = result.find((p) => p.slug === 'auto');
      if (autoProfile) {
        selectedProfileId.value = autoProfile.id;
      } else if (result.length > 0) {
        selectedProfileId.value = result[0].id;
      }
    });

    async function handleRunAll(): Promise<void> {
      const problem = (document.getElementById('problem-input') as HTMLTextAreaElement | null)?.value ?? '';
      await agentsService.runAllAgents(selectedProfileId.value, problem);
    }

    const completedCount = computed(() =>
      agentStatuses.value.filter((a) => a.status === 'completed' || a.status === 'error').length,
    );
    const totalCount = computed(() => agentStatuses.value.length);
    const progressPct = computed(() =>
      totalCount.value > 0 ? Math.round((completedCount.value / totalCount.value) * 100) : 0,
    );

    return {
      agentStatuses,
      isRunning,
      sessionId,
      handleRunAll,
      profiles,
      selectedProfileId,
      profilesError,
      completedCount,
      totalCount,
      progressPct,
    };
  },
});
