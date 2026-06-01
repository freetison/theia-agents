/**
 * NestJS DI tokens.
 * All injectable services must be typed via these interfaces/tokens.
 * Concrete classes are NEVER injected — only IXxx interfaces.
 */

import type { Observable } from 'rxjs';
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
  agentOutputs?: AgentOutputRow[];
}

export interface ProfileSummary {
  id: string;
  tenantId: string | null;
  name: string;
  slug: string;
  description?: string;
  agentCount: number;
}

export interface CreateProfileInput {
  name: string;
  slug: string;
  description?: string;
  agents: Array<{ agentId: string; sequence: number }>;
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
  create(input: CreateProfileInput, tenantId: string): Promise<Result<ProfileSummary, DomainError>>;
}

export interface IPromptsService {
  findByAgent(agentName: string, tenantId: string): Promise<Result<PromptSummary, DomainError>>;
}

export interface IAgentsService {
  run(request: AgentRunRequest): Promise<Result<void, DomainError>>;
  streamProgress(sessionId: string): Observable<AgentProgress>;
}

// ─── Injection tokens ─────────────────────────────────────────────────────────

export const SESSIONS_SERVICE = 'SESSIONS_SERVICE' as const;
export const PROFILES_SERVICE = 'PROFILES_SERVICE' as const;
export const PROMPTS_SERVICE = 'PROMPTS_SERVICE' as const;
export const AGENTS_SERVICE = 'AGENTS_SERVICE' as const;

// ─── Repository domain types ──────────────────────────────────────────────────

export interface ProfileRow {
  id: string;
  tenantId: string;
  slug: string;
  name: string;
  description: string | null;
  version: number;
  isActive: boolean;
  agents: Array<{ agentId: string; sequence: number; context: string | null; requires: string[] }>;
}

export interface PromptRow {
  id: string;
  tenantId: string | null;
  agentId: string;
  version: number;
  template: string;
  isActive: boolean;
}

export interface RoutingRow {
  tenantId: string | null;
  agentId: string;
  provider: string;
  model: string;
}

export interface SessionRow {
  id: string;
  tenantId: string;
  profileId: string;
  problem: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'partial';
  startedAt: string;
  finishedAt: string | null;
  totalCostUsd: string | null;
  totalTokensIn: number | null;
  totalTokensOut: number | null;
}

export interface AgentOutputRow {
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

// ─── Repository interfaces ─────────────────────────────────────────────────────

export interface IProfileRepo {
  findAll(tenantId: string): Promise<Result<ProfileRow[], DomainError>>;
  findById(id: string, tenantId: string): Promise<Result<ProfileRow, DomainError>>;
  findBySlug(slug: string, tenantId: string): Promise<Result<ProfileRow, DomainError>>;
  upsert(profile: {
    id?: string;
    tenantId: string;
    slug: string;
    name: string;
    description?: string | null;
    version?: number;
    isActive?: boolean;
    agents: Array<{ agentId: string; sequence: number; context: string | null; requires: string[] }>;
  }): Promise<Result<ProfileRow, DomainError>>;
}

export interface IPromptRepo {
  findActive(agentId: string, tenantId: string | null): Promise<Result<PromptRow, DomainError>>;
  upsert(prompt: Omit<PromptRow, 'id'> & { id?: string }): Promise<Result<PromptRow, DomainError>>;
}

export interface IRoutingRepo {
  findByAgent(agentId: string, tenantId: string | null): Promise<Result<RoutingRow, DomainError>>;
  upsertMany(rows: RoutingRow[]): Promise<Result<void, DomainError>>;
}

export interface ISessionRepo {
  findAll(tenantId: string): Promise<Result<SessionRow[], DomainError>>;
  findById(id: string, tenantId: string): Promise<Result<SessionRow, DomainError>>;
  create(row: Omit<SessionRow, 'id' | 'startedAt' | 'finishedAt'>): Promise<Result<SessionRow, DomainError>>;
  updateStatus(
    id: string,
    tenantId: string,
    status: SessionRow['status'],
    extras?: { finishedAt?: string; totalCostUsd?: string; totalTokensIn?: number; totalTokensOut?: number },
  ): Promise<Result<void, DomainError>>;
}

export interface IAgentOutputRepo {
  upsert(row: Omit<AgentOutputRow, 'id'>): Promise<Result<AgentOutputRow, DomainError>>;
  findBySession(sessionId: string): Promise<Result<AgentOutputRow[], DomainError>>;
}

// ─── Repo injection tokens ────────────────────────────────────────────────────

export const PROFILE_REPO = 'PROFILE_REPO' as const;
export const PROMPT_REPO = 'PROMPT_REPO' as const;
export const ROUTING_REPO = 'ROUTING_REPO' as const;
export const SESSION_REPO = 'SESSION_REPO' as const;
export const AGENT_OUTPUT_REPO = 'AGENT_OUTPUT_REPO' as const;

// ─── DB connection token ──────────────────────────────────────────────────────

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION' as const;

