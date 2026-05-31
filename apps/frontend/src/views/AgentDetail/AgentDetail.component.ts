import { defineComponent, ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useSession } from '../../composables/useSession';
import type { SessionSummary } from '../../tokens/SESSIONS_TOKEN';

export default defineComponent({
  name: 'AgentDetail',

  setup() {
    const route = useRoute();
    const sessionsService = useSession();
    const session = ref<SessionSummary | null>(null);
    const loading = ref(false);
    const errorMsg = ref<string | null>(null);

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

    return { session, loading, errorMsg, formatJson };
  },
});
