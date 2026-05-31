import { defineComponent, computed } from 'vue';
import { useAgents } from '../../composables/useAgents';
import AgentCard from '../../components/AgentCard/AgentCard.vue';

const DEFAULT_PROFILE_ID = import.meta.env['VITE_DEFAULT_PROFILE_ID'] ?? '';

export default defineComponent({
  name: 'TeamOverview',

  components: { AgentCard },

  setup() {
    const agentsService = useAgents();
    const { agentStatuses, isRunning, sessionId, runAllAgents } = agentsService;

    const problemText = computed({
      get: () => (typeof window !== 'undefined' ? (window as any).__problemText ?? '' : ''),
      set: (v: string) => { if (typeof window !== 'undefined') (window as any).__problemText = v; },
    });

    async function handleRunAll(): Promise<void> {
      const problem = (document.getElementById('problem-input') as HTMLTextAreaElement | null)?.value ?? '';
      await runAllAgents(DEFAULT_PROFILE_ID, problem);
    }

    return {
      agentStatuses,
      isRunning,
      sessionId,
      handleRunAll,
    };
  },
});
