import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { ok, err } from '@theia-core/result';
import type { Result, DomainError } from '@theia-core/result';
import type { TheiaDb } from '../connection';
import { sessionAgentOutputs } from '../schema';
import type { IAgentOutputRepo, AgentOutputRow } from '../../types';
import { DATABASE_CONNECTION } from '../../types';

@Injectable()
export class AgentOutputsRepo implements IAgentOutputRepo {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: TheiaDb) {}

  /**
   * Idempotent upsert: ON CONFLICT (session_id, agent_id) DO UPDATE
   * so a retry with a better status overwrites the failed one.
   */
  async upsert(row: Omit<AgentOutputRow, 'id'>): Promise<Result<AgentOutputRow, DomainError>> {
    try {
      const [inserted] = await this.db
        .insert(sessionAgentOutputs)
        .values({
          sessionId: row.sessionId,
          agentId: row.agentId,
          sequence: row.sequence,
          role: row.role,
          summary: row.summary,
          structuredOutput: row.structuredOutput,
          rawResponse: null,
          provider: row.provider,
          model: row.model,
          latencyMs: row.latencyMs,
          tokensIn: row.tokensIn,
          tokensOut: row.tokensOut,
          costUsd: row.costUsd,
          status: row.status,
          attempts: 1,
        })
        .onConflictDoUpdate({
          target: [sessionAgentOutputs.sessionId, sessionAgentOutputs.agentId],
          set: {
            structuredOutput: row.structuredOutput,
            summary: row.summary,
            latencyMs: row.latencyMs,
            tokensIn: row.tokensIn,
            tokensOut: row.tokensOut,
            status: row.status,
          },
        })
        .returning();

      if (!inserted) {
        return err({ code: 'INTERNAL', message: 'Upsert returned no row', details: {} } as DomainError);
      }
      return ok(this.toRow(inserted));
    } catch (e) {
      return err({ code: 'INTERNAL', message: String(e), details: {} } as DomainError);
    }
  }

  async findBySession(sessionId: string): Promise<Result<AgentOutputRow[], DomainError>> {
    try {
      const rows = await this.db
        .select()
        .from(sessionAgentOutputs)
        .where(eq(sessionAgentOutputs.sessionId, sessionId))
        .orderBy(sessionAgentOutputs.sequence);
      return ok(rows.map(this.toRow));
    } catch (e) {
      return err({ code: 'INTERNAL', message: String(e), details: {} } as DomainError);
    }
  }

  private toRow(row: typeof sessionAgentOutputs.$inferSelect): AgentOutputRow {
    return {
      id: row.id,
      sessionId: row.sessionId,
      agentId: row.agentId,
      sequence: row.sequence,
      role: row.role,
      summary: row.summary,
      structuredOutput: row.structuredOutput,
      provider: row.provider,
      model: row.model,
      latencyMs: row.latencyMs,
      tokensIn: row.tokensIn,
      tokensOut: row.tokensOut,
      costUsd: row.costUsd,
      status: row.status,
    };
  }
}
