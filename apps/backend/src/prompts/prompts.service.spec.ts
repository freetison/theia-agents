import { describe, it, expect, vi } from 'vitest';
import { PromptsService } from '../prompts/prompts.service';
import { isErr, err } from '@theia-core/result';
import type { DomainError } from '@theia-core/result';
import type { IPromptRepo } from '../types';

describe('PromptsService', () => {
  const mockRepo: IPromptRepo = {
    findActive: vi.fn().mockResolvedValue(err({ code: 'NOT_FOUND', message: 'not found', details: {} } as DomainError)),
    upsert: vi.fn(),
  };

  const service = new PromptsService(mockRepo);

  it('findByAgent returns err NOT_FOUND when repo returns NOT_FOUND', async () => {
    const result = await service.findByAgent('biz_evaluator', 'tenant-1');
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.code).toBe('NOT_FOUND');
  });
});
