import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { ok, err } from '@theia-core/result';
import type { Result, DomainError } from '@theia-core/result';
import type { TheiaDb } from '../connection';
import { sessions } from '../schema';
import type { ISessionRepo, SessionRow } from '../../types';
import { DATABASE_CONNECTION } from '../../types';

@Injectable()
export class SessionsRepo implements ISessionRepo {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: TheiaDb) {}

  async findAll(tenantId: string): Promise<Result<SessionRow[], DomainError>> {
    try {
      const rows = await this.db
        .select()
        .from(sessions)
        .where(eq(sessions.tenantId, tenantId))
        .orderBy(desc(sessions.startedAt));
      return ok(rows.map(this.toRow));
    } catch (e) {
      return err({ code: 'INTERNAL', message: String(e), details: {} } as DomainError);
    }
  }

  async findById(id: string, tenantId: string): Promise<Result<SessionRow, DomainError>> {
    try {
      const [row] = await this.db
        .select()
        .from(sessions)
        .where(and(eq(sessions.id, id), eq(sessions.tenantId, tenantId)))
        .limit(1);

      if (!row) {
        return err({ code: 'NOT_FOUND', message: `Session '${id}' not found`, details: {} } as DomainError);
      }
      return ok(this.toRow(row));
    } catch (e) {
      return err({ code: 'INTERNAL', message: String(e), details: {} } as DomainError);
    }
  }

  async create(row: Omit<SessionRow, 'id' | 'startedAt' | 'finishedAt'>): Promise<Result<SessionRow, DomainError>> {
    try {
      const [inserted] = await this.db
        .insert(sessions)
        .values({
          tenantId: row.tenantId,
          profileId: row.profileId,
          problem: row.problem,
          status: row.status as typeof sessions.$inferInsert['status'],
          totalCostUsd: row.totalCostUsd,
          totalTokensIn: row.totalTokensIn,
          totalTokensOut: row.totalTokensOut,
        })
        .returning();

      if (!inserted) {
        return err({ code: 'INTERNAL', message: 'Insert returned no row', details: {} } as DomainError);
      }
      return ok(this.toRow(inserted));
    } catch (e) {
      return err({ code: 'INTERNAL', message: String(e), details: {} } as DomainError);
    }
  }

  async updateStatus(
    id: string,
    tenantId: string,
    status: SessionRow['status'],
    extras?: { finishedAt?: string; totalCostUsd?: string; totalTokensIn?: number; totalTokensOut?: number },
  ): Promise<Result<void, DomainError>> {
    try {
      await this.db
        .update(sessions)
        .set({
          status: status as typeof sessions.$inferInsert['status'],
          ...(extras?.finishedAt ? { finishedAt: new Date(extras.finishedAt) } : {}),
          ...(extras?.totalCostUsd !== undefined ? { totalCostUsd: extras.totalCostUsd } : {}),
          ...(extras?.totalTokensIn !== undefined ? { totalTokensIn: extras.totalTokensIn } : {}),
          ...(extras?.totalTokensOut !== undefined ? { totalTokensOut: extras.totalTokensOut } : {}),
        })
        .where(and(eq(sessions.id, id), eq(sessions.tenantId, tenantId)));
      return ok(undefined);
    } catch (e) {
      return err({ code: 'INTERNAL', message: String(e), details: {} } as DomainError);
    }
  }

  private toRow(row: typeof sessions.$inferSelect): SessionRow {
    return {
      id: row.id,
      tenantId: row.tenantId,
      profileId: row.profileId,
      problem: row.problem,
      status: row.status as SessionRow['status'],
      startedAt: row.startedAt.toISOString(),
      finishedAt: row.finishedAt?.toISOString() ?? null,
      totalCostUsd: row.totalCostUsd,
      totalTokensIn: row.totalTokensIn,
      totalTokensOut: row.totalTokensOut,
    };
  }
}
