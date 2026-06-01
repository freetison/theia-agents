import { Injectable, Inject, OnModuleDestroy } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ok, err, isErr } from '@theia-core/result';
import type { Result, DomainError } from '@theia-core/result';
import { buildGraph, theiaEvents } from '@theia/engine';
import type { AgentDoneEvent } from '@theia/engine';
import type { Profile as EngineProfile } from '@theia/engine';
import type {
  IAgentsService,
  IProfileRepo,
  ISessionRepo,
  IAgentOutputRepo,
  AgentRunRequest,
  AgentProgress,
  ProfileRow,
} from '../types';
import {
  PROFILE_REPO,
  SESSION_REPO,
  AGENT_OUTPUT_REPO,
} from '../types';
import { SessionStreamRegistry } from './session-stream.registry';

/**
 * Real engine integration.
 * Uses a single global listener on theiaEvents, routing events to the correct
 * session stream via sessionId embedded in each event.
 */
@Injectable()
export class AgentEngineService implements IAgentsService, OnModuleDestroy {
  private agentSequence = new Map<string, number>();

  constructor(
    @Inject(PROFILE_REPO) private readonly profileRepo: IProfileRepo,
    @Inject(SESSION_REPO) private readonly sessionRepo: ISessionRepo,
    @Inject(AGENT_OUTPUT_REPO) private readonly outputRepo: IAgentOutputRepo,
    @Inject(SessionStreamRegistry) private readonly registry: SessionStreamRegistry,
  ) {
    theiaEvents.on('agent:done', this.onAgentDone);
  }

  onModuleDestroy(): void {
    theiaEvents.off('agent:done', this.onAgentDone);
  }

  async run(request: AgentRunRequest): Promise<Result<void, DomainError>> {
    const profileResult = await this.profileRepo.findById(
      request.profileId,
      request.tenantId,
    );
    if (isErr(profileResult)) return profileResult;

    const sessionResult = await this.sessionRepo.create({
      id: request.sessionId,
      tenantId: request.tenantId,
      profileId: request.profileId,
      problem: request.problem,
      status: 'running',
      totalCostUsd: null,
      totalTokensIn: null,
      totalTokensOut: null,
    });
    if (isErr(sessionResult)) return sessionResult;

    const session = sessionResult.value;
    this.agentSequence.set(request.sessionId, 0);
    this.registry.getOrCreate(request.sessionId);

    const engineProfile = toEngineProfile(profileResult.value);

    try {
      const graph = buildGraph(engineProfile, request.sessionId);
      const finalState = await graph.invoke({
        problem: request.problem,
        profileId: engineProfile.id,
        profileName: engineProfile.name,
        agentContext: engineProfile.agentConfig,
      });

      const verdict = finalState?.finalReport?.verdict ?? null;
      const viabilityScore = finalState?.finalReport?.viability_score ?? null;

      this.registry.emit(request.sessionId, {
        sessionId: request.sessionId,
        agentName: 'session',
        status: 'completed',
        confidence: viabilityScore != null ? viabilityScore / 10 : undefined,
      });

      await this.sessionRepo.updateStatus(session.id, request.tenantId, 'completed', {
        finishedAt: new Date().toISOString(),
      });

      void verdict;
    } catch (e) {
      this.registry.emit(request.sessionId, {
        sessionId: request.sessionId,
        agentName: 'session',
        status: 'error',
        errorMessage: String(e),
      });
      await this.sessionRepo.updateStatus(session.id, request.tenantId, 'failed', {
        finishedAt: new Date().toISOString(),
      });
      return err({
        code: 'INTERNAL',
        message: `Engine run failed: ${String(e)}`,
        details: {},
      } as DomainError);
    } finally {
      this.registry.complete(request.sessionId);
      this.agentSequence.delete(request.sessionId);
    }

    return ok(undefined);
  }

  streamProgress(sessionId: string): Observable<AgentProgress> {
    return this.registry.watch(sessionId);
  }

  // Arrow function to preserve 'this' when used as event listener
  private readonly onAgentDone = async (event: AgentDoneEvent): Promise<void> => {
    const { sessionId } = event;
    if (!sessionId) return;

    const seq = (this.agentSequence.get(sessionId) ?? 0) + 1;
    this.agentSequence.set(sessionId, seq);

    this.registry.emit(sessionId, {
      sessionId,
      agentName: event.agent,
      status: 'completed',
      confidence: extractConfidence(event.data),
    });

    await this.outputRepo.upsert({
      sessionId,
      agentId: event.agent,
      sequence: seq,
      role: event.role,
      summary: event.summary,
      structuredOutput: event.data,
      provider: 'engine',
      model: 'unknown',
      latencyMs: null,
      tokensIn: null,
      tokensOut: null,
      costUsd: null,
      status: 'completed',
    });
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toEngineProfile(row: ProfileRow): EngineProfile {
  const sorted = [...row.agents].sort((a, b) => a.sequence - b.sequence);
  return {
    id: row.slug,
    name: row.name,
    description: row.description ?? '',
    agents: sorted.map((a) => a.agentId),
    agentConfig: Object.fromEntries(
      sorted.map((a) => [a.agentId, { context: a.context ?? undefined }]),
    ),
  };
}

function extractConfidence(data: Record<string, unknown>): number | undefined {
  const outputs = Object.values(data).filter(
    (v): v is { confidence: number } =>
      v !== null &&
      typeof v === 'object' &&
      'confidence' in (v as object) &&
      typeof (v as Record<string, unknown>)['confidence'] === 'number',
  );
  return outputs.at(-1)?.confidence;
}
