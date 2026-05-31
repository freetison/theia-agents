import type { InjectionKey } from 'vue';

export interface SessionSummary {
  id: string;
  tenantId: string;
  profileId: string;
  problem: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  createdAt: string;
  completedAt?: string;
}

export interface ISessionsService {
  findAll(): Promise<SessionSummary[]>;
  findById(id: string): Promise<SessionSummary>;
}

export const SESSIONS_TOKEN: InjectionKey<ISessionsService> = Symbol('ISessionsService');
