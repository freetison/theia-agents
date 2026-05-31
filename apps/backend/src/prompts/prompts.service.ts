import { Injectable } from '@nestjs/common';
import { ok, err, type Result } from '@theia-core/result';
import type { DomainError } from '@theia-core/result';
import type { IPromptsService, PromptSummary } from '../types';

@Injectable()
export class PromptsService implements IPromptsService {
  async findByAgent(agentName: string, _tenantId: string): Promise<Result<PromptSummary, DomainError>> {
    // TODO (Fase 3 — DB): query latest prompt version for agentName + tenant cascade
    void agentName;
    return err({ code: 'NOT_FOUND', message: `No prompt found for agent ${agentName}`, details: {} } as DomainError);
  }
}
