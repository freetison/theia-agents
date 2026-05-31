import { Injectable, Inject } from '@nestjs/common';
import { eq, and, isNull } from 'drizzle-orm';
import { ok, err } from '@theia-core/result';
import type { Result, DomainError } from '@theia-core/result';
import type { TheiaDb } from '../connection';
import { prompts } from '../schema';
import type { IPromptRepo, PromptRow } from '../../types';
import { DATABASE_CONNECTION } from '../../types';

@Injectable()
export class PromptsRepo implements IPromptRepo {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: TheiaDb) {}

  /**
   * Tenant-cascade: looks for active prompt for (tenantId, agentId) first,
   * then falls back to global (tenant_id IS NULL).
   */
  async findActive(agentId: string, tenantId: string | null): Promise<Result<PromptRow, DomainError>> {
    try {
      let row = tenantId
        ? await this.findActiveFor(agentId, tenantId)
        : null;

      if (!row) {
        row = await this.findActiveFor(agentId, null);
      }

      if (!row) {
        return err({ code: 'NOT_FOUND', message: `No active prompt for agent '${agentId}'`, details: {} } as DomainError);
      }

      return ok(this.toRow(row));
    } catch (e) {
      return err({ code: 'INTERNAL', message: String(e), details: {} } as DomainError);
    }
  }

  async upsert(prompt: Omit<PromptRow, 'id'> & { id?: string }): Promise<Result<PromptRow, DomainError>> {
    try {
      // onConflictDoUpdate doesn't handle nullable columns in conflict target.
      // Use explicit check-and-update pattern instead.
      const existing = await this.findActiveFor(prompt.agentId, prompt.tenantId, false);

      if (existing) {
        const [updated] = await this.db
          .update(prompts)
          .set({ template: prompt.template, isActive: prompt.isActive })
          .where(eq(prompts.id, existing.id))
          .returning();
        return ok(this.toRow(updated!));
      }

      const [inserted] = await this.db
        .insert(prompts)
        .values({
          id: prompt.id as string | undefined,
          tenantId: prompt.tenantId,
          agentId: prompt.agentId,
          version: prompt.version,
          template: prompt.template,
          isActive: prompt.isActive,
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

  private async findActiveFor(agentId: string, tenantId: string | null, requireActive = true) {
    const condition = tenantId
      ? requireActive
        ? and(eq(prompts.agentId, agentId), eq(prompts.tenantId, tenantId), eq(prompts.isActive, true))
        : and(eq(prompts.agentId, agentId), eq(prompts.tenantId, tenantId))
      : requireActive
        ? and(eq(prompts.agentId, agentId), isNull(prompts.tenantId), eq(prompts.isActive, true))
        : and(eq(prompts.agentId, agentId), isNull(prompts.tenantId));

    const [row] = await this.db.select().from(prompts).where(condition).limit(1);
    return row ?? null;
  }

  private toRow(row: typeof prompts.$inferSelect): PromptRow {
    return {
      id: row.id,
      tenantId: row.tenantId,
      agentId: row.agentId,
      version: row.version,
      template: row.template,
      isActive: row.isActive,
    };
  }
}
