import type { InjectionKey, Ref } from 'vue';

export interface AgentStatus {
  name: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  confidence?: number;
  summary?: string;
  errorMessage?: string;
}

export interface IAgentsService {
  agentStatuses: Ref<AgentStatus[]>;
  sessionId: Ref<string | null>;
  isRunning: Ref<boolean>;
  runAllAgents(profileId: string, problem: string): Promise<void>;
  openProgressStream(sessionId: string): void;
  closeProgressStream(): void;
}

export const AGENTS_TOKEN: InjectionKey<IAgentsService> = Symbol('IAgentsService');
