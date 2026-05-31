import { ref, onUnmounted } from 'vue';
import type { Ref } from 'vue';

export interface AgentProgressItem {
  agentName: string;
  status: 'started' | 'completed' | 'error';
  confidence?: number;
  errorMessage?: string;
}

export interface SessionStreamState {
  progress: Ref<AgentProgressItem[]>;
  isComplete: Ref<boolean>;
  error: Ref<string | null>;
}

export function useSessionStream(sessionId: string): SessionStreamState {
  const progress = ref<AgentProgressItem[]>([]);
  const isComplete = ref(false);
  const error = ref<string | null>(null);

  const apiUrl = import.meta.env['VITE_API_URL'] ?? 'http://localhost:3000';
  const url = `${apiUrl}/agents/sessions/${sessionId}/progress`;
  const es = new EventSource(url);

  es.onmessage = (ev: MessageEvent) => {
    const data = JSON.parse(ev.data as string) as AgentProgressItem & { agentName: string; status: string };
    if (data.agentName === 'session') {
      isComplete.value = true;
      es.close();
      return;
    }
    progress.value = [...progress.value, data as AgentProgressItem];
  };

  es.onerror = () => {
    error.value = 'SSE connection error';
    es.close();
  };

  onUnmounted(() => {
    es.close();
  });

  return { progress, isComplete, error };
}
