import { describe, it, expect, vi } from 'vitest';
import { ProfilesService } from '../profiles/profiles.service';
import { isOk, isErr, ok, err } from '@theia-core/result';
import type { DomainError } from '@theia-core/result';
import type { IProfileRepo } from '../types';

describe('ProfilesService', () => {
  const mockRepo: IProfileRepo = {
    findAll: vi.fn().mockResolvedValue(ok([])),
    findBySlug: vi.fn().mockResolvedValue(err({ code: 'NOT_FOUND', message: 'not found', details: {} } as DomainError)),
    upsert: vi.fn(),
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
});
