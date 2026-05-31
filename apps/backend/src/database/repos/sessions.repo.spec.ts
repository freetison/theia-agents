import { describe, it, expect, beforeEach } from 'vitest';
import { isOk, isErr } from '@theia-core/result';
import { createTestDb } from '../test-helpers/create-test-db';
import { SessionsRepo } from './sessions.repo';
import { tenants, profiles } from '../schema';

describe('SessionsRepo', () => {
  let db: Awaited<ReturnType<typeof createTestDb>>['db'];
  let repo: SessionsRepo;
  let tenantId: string;
  let profileId: string;

  beforeEach(async () => {
    ({ db } = await createTestDb());
    repo = new SessionsRepo(db as any);

    const [t] = await db.insert(tenants).values({ slug: 'sess-tenant' }).returning();
    tenantId = t!.id;

    const [p] = await db.insert(profiles).values({ tenantId, slug: 'default', name: 'Default' }).returning();
    profileId = p!.id;
  });

  it('returns empty array when no sessions', async () => {
    const r = await repo.findAll(tenantId);
    expect(isOk(r)).toBe(true);
    if (isOk(r)) expect(r.value).toHaveLength(0);
  });

  it('creates and retrieves session', async () => {
    const r = await repo.create({ tenantId, profileId, problem: 'Evaluate B2B', status: 'pending', totalCostUsd: null, totalTokensIn: null, totalTokensOut: null });
    expect(isOk(r)).toBe(true);
    if (!isOk(r)) return;

    const found = await repo.findById(r.value.id, tenantId);
    expect(isOk(found)).toBe(true);
    if (isOk(found)) {
      expect(found.value.problem).toBe('Evaluate B2B');
      expect(found.value.status).toBe('pending');
    }
  });

  it('updateStatus changes status', async () => {
    const created = await repo.create({ tenantId, profileId, problem: 'test', status: 'pending', totalCostUsd: null, totalTokensIn: null, totalTokensOut: null });
    if (!isOk(created)) return;
    const id = created.value.id;

    const upd = await repo.updateStatus(id, tenantId, 'completed', { totalCostUsd: '0.05', totalTokensIn: 100, totalTokensOut: 200 });
    expect(isOk(upd)).toBe(true);

    const found = await repo.findById(id, tenantId);
    if (isOk(found)) {
      expect(found.value.status).toBe('completed');
      expect(found.value.totalCostUsd).toBe('0.05');
    }
  });

  it('findById returns NOT_FOUND for wrong tenant', async () => {
    const created = await repo.create({ tenantId, profileId, problem: 'p', status: 'pending', totalCostUsd: null, totalTokensIn: null, totalTokensOut: null });
    if (!isOk(created)) return;

    const wrongTenantId = crypto.randomUUID(); // valid UUID, just doesn't match
    const r = await repo.findById(created.value.id, wrongTenantId);
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('findAll only returns sessions for the given tenant', async () => {
    await repo.create({ tenantId, profileId, problem: 'A', status: 'pending', totalCostUsd: null, totalTokensIn: null, totalTokensOut: null });
    const otherTenantId = crypto.randomUUID(); // valid UUID but no sessions
    const r = await repo.findAll(otherTenantId);
    expect(isOk(r)).toBe(true);
    if (isOk(r)) expect(r.value).toHaveLength(0);
  });
});
