import { Injectable } from '@nestjs/common';
import { ok, err, type Result } from '@theia-core/result';
import type { DomainError } from '@theia-core/result';
import type { IAgentsService, AgentRunRequest, AgentProgress } from '../types';

@Injectable()
export class AgentsService implements IAgentsService {
  async run(request: AgentRunRequest): Promise<Result<void, DomainError>> {
    // TODO (Fase 4 — Engine integration): invoke buildGraph, subscribe to theiaEvents,
    // emit SSE progress events, persist outputs via ISessionRepo
    void request;
    return err({
      code: 'INTERNAL',
      message: 'Engine integration not yet implemented',
      details: {},
    } as DomainError);
  }

  async *streamProgress(_sessionId: string): AsyncIterable<AgentProgress> {
    // TODO (Fase 4 — Engine integration): yield progress from in-memory event bus
    // keyed by sessionId once theiaEvents singleton is replaced by per-session emitter
    yield* [];
  }
}
