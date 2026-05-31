/**
 * NestJS DI tokens.
 * All injectable services must be typed via these interfaces/tokens.
 * Concrete classes are NEVER injected — only IXxx interfaces.
 */

import type { Result, DomainError } from '@theia-core/result';

// ─── Domain types ────────────────────────────────────────────────────────────

export interface SessionSummary {
  id: string;
  tenantId: string;
  profileId: string;
  problem: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  createdAt: string;
  completedAt?: string;
}

export interface ProfileSummary {
  id: string;
  tenantId: string | null;
  name: string;
  description?: string;
  agentCount: number;
}

export interface PromptSummary {
  id: string;
  agentName: string;
  version: number;
  content: string;
}

export interface AgentRunRequest {
  sessionId: string;
  profileId: string;
  problem: string;
  tenantId: string;
}

export interface AgentProgress {
  sessionId: string;
  agentName: string;
  status: 'started' | 'completed' | 'error';
  confidence?: number;
  errorMessage?: string;
}

// ─── Service interfaces ───────────────────────────────────────────────────────

export interface ISessionsService {
  findAll(tenantId: string): Promise<Result<SessionSummary[], DomainError>>;
  findById(id: string, tenantId: string): Promise<Result<SessionSummary, DomainError>>;
  create(
    tenantId: string,
    profileId: string,
    problem: string,
  ): Promise<Result<SessionSummary, DomainError>>;
}

export interface IProfilesService {
  findAll(tenantId: string): Promise<Result<ProfileSummary[], DomainError>>;
  findById(id: string, tenantId: string): Promise<Result<ProfileSummary, DomainError>>;
}

export interface IPromptsService {
  findByAgent(agentName: string, tenantId: string): Promise<Result<PromptSummary, DomainError>>;
}

export interface IAgentsService {
  run(request: AgentRunRequest): Promise<Result<void, DomainError>>;
  streamProgress(sessionId: string): AsyncIterable<AgentProgress>;
}

// ─── Injection tokens ─────────────────────────────────────────────────────────

export const SESSIONS_SERVICE = 'SESSIONS_SERVICE' as const;
export const PROFILES_SERVICE = 'PROFILES_SERVICE' as const;
export const PROMPTS_SERVICE = 'PROMPTS_SERVICE' as const;
export const AGENTS_SERVICE = 'AGENTS_SERVICE' as const;
