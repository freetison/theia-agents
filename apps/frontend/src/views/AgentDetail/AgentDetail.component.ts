import { defineComponent, ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useSession } from '../../composables/useSession';
import type { SessionSummary, AgentOutput } from '../../tokens/SESSIONS_TOKEN';

export default defineComponent({
  name: 'AgentDetail',

  setup() {
    const route = useRoute();
    const sessionsService = useSession();
    const session = ref<SessionSummary | null>(null);
    const loading = ref(false);
    const errorMsg = ref<string | null>(null);
    const rawExpanded = ref(false);

    const agentId = computed(() => {
      const id = route.params['agentId'];
      return typeof id === 'string' ? id : null;
    });

    const selectedAgent = computed<AgentOutput | null>(() => {
      if (!agentId.value || !session.value?.agentOutputs) return null;
      return session.value.agentOutputs.find((o) => o.agentId === agentId.value) ?? null;
    });

    const selectedAgentConfidence = computed<number | null>(() => {
      const output = selectedAgent.value?.structuredOutput;
      if (output !== null && typeof output === 'object') {
        const confidence = (output as Record<string, unknown>)['confidence'];
        return typeof confidence === 'number' ? confidence : null;
      }
      return null;
    });

    onMounted(async () => {
      const id = route.params['id'];
      if (typeof id !== 'string') return;
      loading.value = true;
      try {
        session.value = await sessionsService.findById(id);
      } catch (e) {
        errorMsg.value = String(e);
      } finally {
        loading.value = false;
      }
    });

    function formatJson(obj: unknown): string {
      return JSON.stringify(obj, null, 2);
    }

    function toggleRaw(): void {
      rawExpanded.value = !rawExpanded.value;
    }

    return {
      session,
      loading,
      errorMsg,
      agentId,
      selectedAgent,
      selectedAgentConfidence,
      rawExpanded,
      formatJson,
      toggleRaw,
    };
  },
});
