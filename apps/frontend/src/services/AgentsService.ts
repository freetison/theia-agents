import { ref } from 'vue';
import type { Ref } from 'vue';
import type { IHttpClient } from '../tokens/HTTP_TOKEN';
import type { IAgentsService, AgentStatus } from '../tokens/AGENTS_TOKEN';

interface RunResponse {
  sessionId: string;
  status: string;
}

interface ProgressEvent {
  sessionId: string;
  agentName: string;
  status: 'started' | 'completed' | 'error';
  confidence?: number;
  errorMessage?: string;
}

export class AgentsService implements IAgentsService {
  readonly agentStatuses: Ref<AgentStatus[]>;
  readonly sessionId: Ref<string | null>;
  readonly isRunning: Ref<boolean>;

  private eventSource: EventSource | null = null;

  private http: IHttpClient;

  constructor(http: IHttpClient) {
    this.http = http;
    this.agentStatuses = ref<AgentStatus[]>([]);
    this.sessionId = ref<string | null>(null);
    this.isRunning = ref(false);
  }

  async runAllAgents(profileId: string, problem: string): Promise<void> {
    this.isRunning.value = true;
    this.agentStatuses.value = [];  // will be populated by SSE events

    const response = await this.http.post<RunResponse>('/agents/run', { profileId, problem });
    this.sessionId.value = response.sessionId;
    this.openProgressStream(response.sessionId);
  }

  openProgressStream(sessionId: string): void {
    this.closeProgressStream();
    const apiUrl = import.meta.env['VITE_API_URL'] ?? 'http://localhost:3000';
    const tenantId = import.meta.env['VITE_TENANT_ID'] ?? '';
    const url = `${apiUrl}/agents/sessions/${sessionId}/progress?tenantId=${tenantId}`;
    this.eventSource = new EventSource(url);

    this.eventSource.onmessage = (ev: MessageEvent) => {
      const data = JSON.parse(ev.data as string) as ProgressEvent;
      this.handleProgressEvent(data);
    };

    this.eventSource.onerror = () => {
      this.isRunning.value = false;
      this.closeProgressStream();
    };
  }

  closeProgressStream(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  private handleProgressEvent(event: ProgressEvent): void {
    const isSessionEvent = event.agentName === 'session';

    if (isSessionEvent) {
      this.isRunning.value = false;
      this.closeProgressStream();
      return;
    }

    const idx = this.agentStatuses.value.findIndex((a) => a.name === event.agentName);
    const statusMap: Record<ProgressEvent['status'], AgentStatus['status']> = {
      started: 'running',
      completed: 'completed',
      error: 'error',
    };

    const newEntry: AgentStatus = {
      name: event.agentName,
      status: statusMap[event.status],
      confidence: event.confidence,
      errorMessage: event.errorMessage,
    };

    if (idx >= 0) {
      this.agentStatuses.value = [
        ...this.agentStatuses.value.slice(0, idx),
        newEntry,
        ...this.agentStatuses.value.slice(idx + 1),
      ];
    } else {
      this.agentStatuses.value = [...this.agentStatuses.value, newEntry];
    }
  }
}
