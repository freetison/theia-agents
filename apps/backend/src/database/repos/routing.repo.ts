import { Injectable, Inject } from '@nestjs/common';
import { eq, and, isNull } from 'drizzle-orm';
import { ok, err } from '@theia-core/result';
import type { Result, DomainError } from '@theia-core/result';
import type { TheiaDb } from '../connection';
import { agentModelRouting } from '../schema';
import type { IRoutingRepo, RoutingRow } from '../../types';
import { DATABASE_CONNECTION } from '../../types';

@Injectable()
export class RoutingRepo implements IRoutingRepo {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: TheiaDb) {}

  /**
   * Cascade: specific agentId for tenant → wildcard '*' for tenant → global default
   */
  async findByAgent(agentId: string, tenantId: string | null): Promise<Result<RoutingRow, DomainError>> {
    try {
      const candidates = [
        ...(tenantId ? [{ agentId, tenantId }, { agentId: '*', tenantId }] : []),
        { agentId, tenantId: null },
        { agentId: '*', tenantId: null },
      ];

      for (const c of candidates) {
        const row = await this.queryOne(c.agentId, c.tenantId);
        if (row) {
          return ok({ tenantId: row.tenantId, agentId: row.agentId, provider: row.provider, model: row.model });
        }
      }

      return err({ code: 'NOT_FOUND', message: `No routing for agent '${agentId}'`, details: {} } as DomainError);
    } catch (e) {
      return err({ code: 'INTERNAL', message: String(e), details: {} } as DomainError);
    }
  }

  async upsertMany(rows: RoutingRow[]): Promise<Result<void, DomainError>> {
    try {
      for (const row of rows) {
        await this.db
          .insert(agentModelRouting)
          .values({ tenantId: row.tenantId, agentId: row.agentId, provider: row.provider, model: row.model })
          .onConflictDoNothing();
      }
      return ok(undefined);
    } catch (e) {
      return err({ code: 'INTERNAL', message: String(e), details: {} } as DomainError);
    }
  }

  private async queryOne(agentId: string, tenantId: string | null) {
    const condition = tenantId
      ? and(eq(agentModelRouting.agentId, agentId), eq(agentModelRouting.tenantId, tenantId))
      : and(eq(agentModelRouting.agentId, agentId), isNull(agentModelRouting.tenantId));
    const [row] = await this.db.select().from(agentModelRouting).where(condition).limit(1);
    return row ?? null;
  }
}
