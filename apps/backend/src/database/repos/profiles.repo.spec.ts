import { describe, it, expect, beforeEach } from 'vitest';
import { isOk, isErr } from '@theia-core/result';
import { createTestDb } from '../test-helpers/create-test-db';
import { ProfilesRepo } from './profiles.repo';
import { tenants } from '../schema';

describe('ProfilesRepo', () => {
  let db: Awaited<ReturnType<typeof createTestDb>>['db'];
  let repo: ProfilesRepo;
  let tenantId: string;

  beforeEach(async () => {
    ({ db } = await createTestDb());
    repo = new ProfilesRepo(db as any);

    const [t] = await db.insert(tenants).values({ slug: 'test-tenant' }).returning();
    tenantId = t!.id;
  });

  it('returns NOT_FOUND for unknown slug', async () => {
    const r = await repo.findBySlug('no-such', tenantId);
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('upserts and retrieves profile with agents', async () => {
    const r = await repo.upsert({
      tenantId,
      slug: 'startup',
      name: 'Startup Team',
      description: 'Fast',
      agents: [
        { agentId: 'biz_evaluator', sequence: 0, context: 'B2B context', requires: [] },
        { agentId: 'growth_hacker', sequence: 1, context: null, requires: ['biz_evaluator'] },
      ],
    });
    expect(isOk(r)).toBe(true);

    const found = await repo.findBySlug('startup', tenantId);
    expect(isOk(found)).toBe(true);
    if (isOk(found)) {
      expect(found.value.name).toBe('Startup Team');
      expect(found.value.agents).toHaveLength(2);
      expect(found.value.agents[0]!.agentId).toBe('biz_evaluator');
      expect(found.value.agents[1]!.requires).toEqual(['biz_evaluator']);
    }
  });

  it('upsert is idempotent — re-running replaces agents', async () => {
    await repo.upsert({ tenantId, slug: 'p1', name: 'P1', agents: [{ agentId: 'a', sequence: 0, context: null, requires: [] }] });
    const r = await repo.upsert({ tenantId, slug: 'p1', name: 'P1 v2', agents: [{ agentId: 'b', sequence: 0, context: null, requires: [] }, { agentId: 'c', sequence: 1, context: null, requires: [] }] });
    expect(isOk(r)).toBe(true);

    const found = await repo.findBySlug('p1', tenantId);
    if (isOk(found)) {
      expect(found.value.name).toBe('P1 v2');
      expect(found.value.agents).toHaveLength(2);
      expect(found.value.agents.map((a) => a.agentId)).toEqual(['b', 'c']);
    }
  });

  it('findAll returns all profiles for tenant', async () => {
    await repo.upsert({ tenantId, slug: 'alpha', name: 'Alpha', agents: [] });
    await repo.upsert({ tenantId, slug: 'beta', name: 'Beta', agents: [] });
    const r = await repo.findAll(tenantId);
    expect(isOk(r)).toBe(true);
    if (isOk(r)) expect(r.value).toHaveLength(2);
  });
});
