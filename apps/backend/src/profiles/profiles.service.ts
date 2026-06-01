import { Injectable, Inject } from '@nestjs/common';
import { ok, isErr, type Result } from '@theia-core/result';
import type { DomainError } from '@theia-core/result';
import type { IProfilesService, ProfileSummary, IProfileRepo, CreateProfileInput } from '../types';
import { PROFILE_REPO } from '../types';

function toSummary(p: { id: string; tenantId: string; slug: string; name: string; description: string | null; agents: unknown[] }): ProfileSummary {
  return {
    id: p.id,
    tenantId: p.tenantId,
    slug: p.slug,
    name: p.name,
    description: p.description ?? undefined,
    agentCount: p.agents.length,
  };
}

@Injectable()
export class ProfilesService implements IProfilesService {
  constructor(@Inject(PROFILE_REPO) private readonly repo: IProfileRepo) {}

  async findAll(tenantId: string): Promise<Result<ProfileSummary[], DomainError>> {
    const result = await this.repo.findAll(tenantId);
    if (isErr(result)) return result;
    return ok(result.value.map(toSummary));
  }

  async findById(id: string, tenantId: string): Promise<Result<ProfileSummary, DomainError>> {
    const result = await this.repo.findBySlug(id, tenantId);
    if (isErr(result)) return result;
    return ok(toSummary(result.value));
  }

  async create(input: CreateProfileInput, tenantId: string): Promise<Result<ProfileSummary, DomainError>> {
    const result = await this.repo.upsert({
      tenantId,
      slug: input.slug,
      name: input.name,
      description: input.description ?? null,
      agents: input.agents.map((a) => ({ agentId: a.agentId, sequence: a.sequence, context: null, requires: [] })),
    });
    if (isErr(result)) return result;
    return ok(toSummary(result.value));
  }
}

