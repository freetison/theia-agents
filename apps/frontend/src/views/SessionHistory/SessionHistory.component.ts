import { defineComponent, ref, onMounted } from 'vue';
import { useSession } from '../../composables/useSession';
import type { SessionSummary } from '../../tokens/SESSIONS_TOKEN';

export default defineComponent({
  name: 'SessionHistory',

  setup() {
    const sessionsService = useSession();
    const sessions = ref<SessionSummary[]>([]);
    const loading = ref(false);
    const errorMsg = ref<string | null>(null);

    onMounted(async () => {
      loading.value = true;
      try {
        sessions.value = await sessionsService.findAll();
      } catch (e) {
        errorMsg.value = String(e);
      } finally {
        loading.value = false;
      }
    });

    function formatDate(iso: string): string {
      return new Date(iso).toLocaleString();
    }

    return { sessions, loading, errorMsg, formatDate };
  },
});
