import { Injectable } from '@nestjs/common';
import { ok, err, type Result } from '@theia-core/result';
import type { DomainError } from '@theia-core/result';
import type { IProfilesService, ProfileSummary } from '../types';

@Injectable()
export class ProfilesService implements IProfilesService {
  async findAll(_tenantId: string): Promise<Result<ProfileSummary[], DomainError>> {
    // TODO (Fase 3 — DB): query profiles from Drizzle repo, merge tenant + global
    return ok([]);
  }

  async findById(id: string, _tenantId: string): Promise<Result<ProfileSummary, DomainError>> {
    // TODO (Fase 3 — DB): query single profile
    void id;
    return err({ code: 'NOT_FOUND', message: `Profile ${id} not found`, details: {} } as DomainError);
  }
}
