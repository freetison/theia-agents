import { Injectable, Inject } from '@nestjs/common';
import { ok, isErr, type Result } from '@theia-core/result';
import type { DomainError } from '@theia-core/result';
import type { IProfilesService, ProfileSummary, IProfileRepo } from '../types';
import { PROFILE_REPO } from '../types';

@Injectable()
export class ProfilesService implements IProfilesService {
  constructor(@Inject(PROFILE_REPO) private readonly repo: IProfileRepo) {}

  async findAll(tenantId: string): Promise<Result<ProfileSummary[], DomainError>> {
    const result = await this.repo.findAll(tenantId);
    if (isErr(result)) return result;
    return ok(
      result.value.map((p) => ({
        id: p.id,
        tenantId: p.tenantId,
        name: p.name,
        description: p.description ?? undefined,
        agentCount: p.agents.length,
      })),
    );
  }

  async findById(id: string, tenantId: string): Promise<Result<ProfileSummary, DomainError>> {
    const result = await this.repo.findBySlug(id, tenantId);
    if (isErr(result)) return result;
    const p = result.value;
    return ok({ id: p.id, tenantId: p.tenantId, name: p.name, description: p.description ?? undefined, agentCount: p.agents.length });
  }
}

