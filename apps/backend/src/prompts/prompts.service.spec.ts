import { describe, it, expect } from 'vitest';
import { PromptsService } from '../prompts/prompts.service';
import { isErr } from '@theia-core/result';

describe('PromptsService', () => {
  const service = new PromptsService();

  it('findByAgent returns err NOT_FOUND (stub)', async () => {
    const result = await service.findByAgent('biz_evaluator', 'tenant-1');
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.code).toBe('NOT_FOUND');
  });
});
