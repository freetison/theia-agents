import { describe, it, expect, vi } from 'vitest';
import { SessionsService } from '../sessions/sessions.service';
import { isOk, isErr, ok, err } from '@theia-core/result';
import type { DomainError } from '@theia-core/result';
import type { ISessionRepo, IAgentOutputRepo, SessionRow } from '../types';

function makeSession(overrides: Partial<SessionRow> = {}): SessionRow {
  return {
    id: crypto.randomUUID(),
    tenantId: 'tenant-1',
    profileId: 'profile-a',
    problem: 'p',
    status: 'pending',
    startedAt: new Date().toISOString(),
    finishedAt: null,
    totalCostUsd: null,
    totalTokensIn: null,
    totalTokensOut: null,
    ...overrides,
  };
}

describe('SessionsService', () => {
  const mockRepo: ISessionRepo = {
    findAll: vi.fn().mockResolvedValue(ok([])),
    findById: vi.fn().mockResolvedValue(err({ code: 'NOT_FOUND', message: 'not found', details: {} } as DomainError)),
    create: vi.fn().mockImplementation(async (row) => ok(makeSession({ ...row, id: crypto.randomUUID(), startedAt: new Date().toISOString() }))),
    updateStatus: vi.fn().mockResolvedValue(ok(undefined)),
  };

  const mockOutputRepo: IAgentOutputRepo = {
    upsert: vi.fn(),
    findBySession: vi.fn().mockResolvedValue(ok([])),
  };

  const service = new SessionsService(mockRepo, mockOutputRepo);

  describe('findAll', () => {
    it('returns ok with empty array', async () => {
      const result = await service.findAll('tenant-1');
      expect(isOk(result)).toBe(true);
      if (isOk(result)) expect(result.value).toEqual([]);
    });
  });

  describe('findById', () => {
    it('returns err NOT_FOUND when repo returns NOT_FOUND', async () => {
      const result = await service.findById('any-id', 'tenant-1');
      expect(isErr(result)).toBe(true);
      if (isErr(result)) expect(result.error.code).toBe('NOT_FOUND');
    });

    it('includes agentOutputs in result when session exists', async () => {
      const session = makeSession({ id: 'sess-1', status: 'completed' });
      (mockRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValueOnce(ok(session));
      (mockOutputRepo.findBySession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        ok([{ id: 'out-1', sessionId: 'sess-1', agentId: 'biz_evaluator', sequence: 1, role: 'analyst', summary: 'done', structuredOutput: {}, provider: 'ollama', model: 'llama3', latencyMs: 100, tokensIn: 10, tokensOut: 20, costUsd: null, status: 'completed' }]),
      );

      const result = await service.findById('sess-1', 'tenant-1');
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.agentOutputs).toHaveLength(1);
        expect(result.value.agentOutputs![0].agentId).toBe('biz_evaluator');
      }
    });
  });

  describe('create', () => {
    it('returns ok with correct fields', async () => {
      const result = await service.create('tenant-1', 'profile-a', 'My business problem');
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.tenantId).toBe('tenant-1');
        expect(result.value.profileId).toBe('profile-a');
        expect(result.value.problem).toBe('My business problem');
        expect(result.value.status).toBe('pending');
      }
    });

    it('generates unique IDs for different sessions', async () => {
      const r1 = await service.create('t', 'p', 'problem');
      const r2 = await service.create('t', 'p', 'problem');
      if (isOk(r1) && isOk(r2)) {
        expect(r1.value.id).not.toBe(r2.value.id);
      }
    });
  });
});


