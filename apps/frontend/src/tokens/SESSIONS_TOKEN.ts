import type { InjectionKey } from 'vue';

export interface AgentOutput {
  id: string;
  sessionId: string;
  agentId: string;
  sequence: number;
  role: string;
  summary: string;
  structuredOutput: unknown;
  provider: string;
  model: string;
  latencyMs: number | null;
  tokensIn: number | null;
  tokensOut: number | null;
  costUsd: string | null;
  status: string;
}

export interface SessionSummary {
  id: string;
  tenantId: string;
  profileId: string;
  problem: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  createdAt: string;
  completedAt?: string;
  agentOutputs?: AgentOutput[];
}

export interface ISessionsService {
  findAll(): Promise<SessionSummary[]>;
  findById(id: string): Promise<SessionSummary>;
}

export const SESSIONS_TOKEN: InjectionKey<ISessionsService> = Symbol('ISessionsService');
