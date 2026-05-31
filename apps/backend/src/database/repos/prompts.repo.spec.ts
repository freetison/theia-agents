import { describe, it, expect, beforeEach } from 'vitest';
import { isOk, isErr } from '@theia-core/result';
import { createTestDb } from '../test-helpers/create-test-db';
import { PromptsRepo } from './prompts.repo';
import { tenants } from '../schema';

describe('PromptsRepo', () => {
  let db: Awaited<ReturnType<typeof createTestDb>>['db'];
  let repo: PromptsRepo;
  let tenantId: string;

  beforeEach(async () => {
    ({ db } = await createTestDb());
    repo = new PromptsRepo(db as any);
    const [t] = await db.insert(tenants).values({ slug: 'test-tenant' }).returning();
    tenantId = t!.id;
  });

  it('returns NOT_FOUND when no prompt exists', async () => {
    const r = await repo.findActive('unknown_agent', tenantId);
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('finds global (tenant-null) prompt when no tenant-specific exists', async () => {
    await repo.upsert({ tenantId: null, agentId: 'analyzer', version: 1, template: 'global prompt', isActive: true });

    const r = await repo.findActive('analyzer', tenantId);
    expect(isOk(r)).toBe(true);
    if (isOk(r)) {
      expect(r.value.template).toBe('global prompt');
      expect(r.value.tenantId).toBeNull();
    }
  });

  it('tenant-specific prompt takes precedence over global', async () => {
    await repo.upsert({ tenantId: null, agentId: 'analyzer', version: 1, template: 'global prompt', isActive: true });
    await repo.upsert({ tenantId, agentId: 'analyzer', version: 1, template: 'tenant prompt', isActive: true });

    const r = await repo.findActive('analyzer', tenantId);
    expect(isOk(r)).toBe(true);
    if (isOk(r)) expect(r.value.template).toBe('tenant prompt');
  });

  it('upsert updates existing prompt template', async () => {
    await repo.upsert({ tenantId: null, agentId: 'biz', version: 1, template: 'v1', isActive: true });
    await repo.upsert({ tenantId: null, agentId: 'biz', version: 1, template: 'v1-updated', isActive: true });

    const r = await repo.findActive('biz', tenantId);
    expect(isOk(r)).toBe(true);
    if (isOk(r)) expect(r.value.template).toBe('v1-updated');
  });
});
