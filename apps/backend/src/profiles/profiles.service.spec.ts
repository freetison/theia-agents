import { describe, it, expect } from 'vitest';
import { ProfilesService } from '../profiles/profiles.service';
import { isOk, isErr } from '@theia-core/result';

describe('ProfilesService', () => {
  const service = new ProfilesService();

  it('findAll returns ok with empty array (stub)', async () => {
    const result = await service.findAll('tenant-1');
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toEqual([]);
  });

  it('findById returns err NOT_FOUND (stub)', async () => {
    const result = await service.findById('unknown', 'tenant-1');
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.code).toBe('NOT_FOUND');
  });
});
