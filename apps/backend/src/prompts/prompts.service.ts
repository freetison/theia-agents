import { Injectable, Inject } from '@nestjs/common';
import { ok, isErr, type Result } from '@theia-core/result';
import type { DomainError } from '@theia-core/result';
import type { IPromptsService, PromptSummary, IPromptRepo } from '../types';
import { PROMPT_REPO } from '../types';

@Injectable()
export class PromptsService implements IPromptsService {
  constructor(@Inject(PROMPT_REPO) private readonly repo: IPromptRepo) {}

  async findByAgent(agentName: string, tenantId: string): Promise<Result<PromptSummary, DomainError>> {
    const result = await this.repo.findActive(agentName, tenantId);
    if (isErr(result)) return result;
    const p = result.value;
    return ok({ id: p.id, agentName: p.agentId, version: p.version, content: p.template });
  }
}

