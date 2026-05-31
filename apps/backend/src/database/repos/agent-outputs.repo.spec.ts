import { describe, it, expect, beforeEach } from 'vitest';
import { isOk } from '@theia-core/result';
import { createTestDb } from '../test-helpers/create-test-db';
import { AgentOutputsRepo } from './agent-outputs.repo';
import { tenants, profiles, sessions } from '../schema';

describe('AgentOutputsRepo', () => {
  let db: Awaited<ReturnType<typeof createTestDb>>['db'];
  let repo: AgentOutputsRepo;
  let sessionId: string;

  beforeEach(async () => {
    ({ db } = await createTestDb());
    repo = new AgentOutputsRepo(db as any);

    const [t] = await db.insert(tenants).values({ slug: 'ao-tenant' }).returning();
    const tenantId = t!.id;

    const [p] = await db.insert(profiles).values({ tenantId, slug: 'default', name: 'D' }).returning();
    const profileId = p!.id;

    const [s] = await db
      .insert(sessions)
      .values({ tenantId, profileId, problem: 'test', status: 'running' })
      .returning();
    sessionId = s!.id;
  });

  const makeOutput = (agentId: string, status = 'completed') => ({
    sessionId,
    agentId,
    sequence: 1,
    role: 'analyst',
    summary: `Summary of ${agentId}`,
    structuredOutput: { key: 'val' },
    provider: 'ollama',
    model: 'llama3.2',
    latencyMs: 500,
    tokensIn: 100,
    tokensOut: 200,
    costUsd: '0.001',
    status,
  });

  it('inserts and finds output by session', async () => {
    const r = await repo.upsert(makeOutput('biz_evaluator'));
    expect(isOk(r)).toBe(true);

    const found = await repo.findBySession(sessionId);
    expect(isOk(found)).toBe(true);
    if (isOk(found)) {
      expect(found.value).toHaveLength(1);
      expect(found.value[0]!.agentId).toBe('biz_evaluator');
    }
  });

  it('upsert updates existing row on conflict (same session+agent)', async () => {
    await repo.upsert(makeOutput('biz_evaluator', 'failed'));
    await repo.upsert({ ...makeOutput('biz_evaluator', 'completed'), summary: 'Updated summary' });

    const found = await repo.findBySession(sessionId);
    expect(isOk(found)).toBe(true);
    if (isOk(found)) {
      expect(found.value).toHaveLength(1);
      expect(found.value[0]!.status).toBe('completed');
      expect(found.value[0]!.summary).toBe('Updated summary');
    }
  });

  it('multiple agents for same session are all returned', async () => {
    await repo.upsert({ ...makeOutput('agent_a'), sequence: 0 });
    await repo.upsert({ ...makeOutput('agent_b'), sequence: 1 });
    await repo.upsert({ ...makeOutput('agent_c'), sequence: 2 });

    const found = await repo.findBySession(sessionId);
    expect(isOk(found)).toBe(true);
    if (isOk(found)) expect(found.value).toHaveLength(3);
  });
});
