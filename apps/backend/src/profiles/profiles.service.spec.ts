import { describe, it, expect, vi } from 'vitest';
import { ProfilesService } from '../profiles/profiles.service';
import { isOk, isErr, ok, err } from '@theia-core/result';
import type { DomainError } from '@theia-core/result';
import type { IProfileRepo, ProfileRow } from '../types';

const stubRow: ProfileRow = {
  id: 'p-1',
  tenantId: 'tenant-1',
  slug: 'test-profile',
  name: 'Test Profile',
  description: null,
  version: 1,
  isActive: true,
  agents: [{ agentId: 'biz_evaluator', sequence: 1, context: null, requires: [] }],
};

describe('ProfilesService', () => {
  const mockRepo: IProfileRepo = {
    findAll: vi.fn().mockResolvedValue(ok([])),
    findBySlug: vi.fn().mockResolvedValue(err({ code: 'NOT_FOUND', message: 'not found', details: {} } as DomainError)),
    findById: vi.fn().mockResolvedValue(ok(stubRow)),
    upsert: vi.fn().mockResolvedValue(ok(stubRow)),
  };

  const service = new ProfilesService(mockRepo);

  it('findAll returns ok with empty array', async () => {
    const result = await service.findAll('tenant-1');
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toEqual([]);
  });

  it('findById returns err NOT_FOUND when repo returns NOT_FOUND', async () => {
    const result = await service.findById('unknown', 'tenant-1');
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.code).toBe('NOT_FOUND');
  });

  it('create calls repo.upsert and returns ProfileSummary with slug', async () => {
    const result = await service.create(
      { name: 'Test Profile', slug: 'test-profile', agents: [{ agentId: 'biz_evaluator', sequence: 1 }] },
      'tenant-1',
    );
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.slug).toBe('test-profile');
      expect(result.value.agentCount).toBe(1);
    }
  });

  it('create returns err when repo.upsert fails', async () => {
    const failRepo: IProfileRepo = {
      ...mockRepo,
      upsert: vi.fn().mockResolvedValue(err({ code: 'DB_ERROR', message: 'db error', details: {} } as DomainError)),
    };
    const svc = new ProfilesService(failRepo);
    const result = await svc.create({ name: 'x', slug: 'x', agents: [] }, 'tenant-1');
    expect(isErr(result)).toBe(true);
  });
});
