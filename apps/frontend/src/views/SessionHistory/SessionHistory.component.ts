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
    const selectedIds = ref<Set<string>>(new Set());
    const isDeleting = ref(false);

    async function loadSessions() {
      loading.value = true;
      try {
        sessions.value = await sessionsService.findAll();
        selectedIds.value.clear();
      } catch (e) {
        errorMsg.value = String(e);
      } finally {
        loading.value = false;
      }
    }

    onMounted(loadSessions);

    function formatDate(iso: string): string {
      return new Date(iso).toLocaleString();
    }

    function toggleSelection(id: string) {
      if (selectedIds.value.has(id)) {
        selectedIds.value.delete(id);
      } else {
        selectedIds.value.add(id);
      }
    }

    function toggleAll(event: Event) {
      const checked = (event.target as HTMLInputElement).checked;
      if (checked) {
        sessions.value.forEach(s => selectedIds.value.add(s.id));
      } else {
        selectedIds.value.clear();
      }
    }

    async function deleteSelected() {
      if (selectedIds.value.size === 0) return;
      if (!confirm('Are you sure you want to delete the selected sessions?')) return;
      
      isDeleting.value = true;
      try {
        await sessionsService.deleteMany(Array.from(selectedIds.value));
        await loadSessions();
      } catch (e) {
        errorMsg.value = String(e);
      } finally {
        isDeleting.value = false;
      }
    }

    async function downloadReport(id: string) {
      const baseUrl = import.meta.env['VITE_API_URL'] ?? 'http://localhost:3000';
      const tenantId = import.meta.env['VITE_TENANT_ID'] ?? '';
      
      try {
        const res = await fetch(`${baseUrl}/sessions/${id}/report`, {
          headers: { 'X-Tenant-Id': tenantId }
        });
        
        if (!res.ok) {
          throw new Error(`Failed to download report: ${res.statusText}`);
        }
        
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${id.slice(0, 8)}.md`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } catch (e) {
        errorMsg.value = String(e);
      }
    }

    return { 
      sessions, 
      loading, 
      errorMsg, 
      formatDate,
      selectedIds,
      toggleSelection,
      toggleAll,
      deleteSelected,
      isDeleting,
      downloadReport
    };
  },
});
