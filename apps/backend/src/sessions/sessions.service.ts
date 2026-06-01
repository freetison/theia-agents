import { Injectable, Inject } from '@nestjs/common';
import { ok, err, isErr, type Result } from '@theia-core/result';
import type { DomainError } from '@theia-core/result';
import type {
  ISessionsService,
  SessionSummary,
  ISessionRepo,
  IAgentOutputRepo,
  SessionRow,
} from '../types';
import { SESSION_REPO, AGENT_OUTPUT_REPO } from '../types';

function toSummary(row: SessionRow): SessionSummary {
  return {
    id: row.id,
    tenantId: row.tenantId,
    profileId: row.profileId,
    problem: row.problem,
    status: row.status === 'failed' ? 'error' : (row.status as SessionSummary['status']),
    createdAt: row.startedAt,
    completedAt: row.finishedAt ?? undefined,
  };
}

@Injectable()
export class SessionsService implements ISessionsService {
  constructor(
    @Inject(SESSION_REPO) private readonly repo: ISessionRepo,
    @Inject(AGENT_OUTPUT_REPO) private readonly outputRepo: IAgentOutputRepo,
  ) {}

  async findAll(tenantId: string): Promise<Result<SessionSummary[], DomainError>> {
    const result = await this.repo.findAll(tenantId);
    if (isErr(result)) return result;
    return ok(result.value.map(toSummary));
  }

  async findById(id: string, tenantId: string): Promise<Result<SessionSummary, DomainError>> {
    const result = await this.repo.findById(id, tenantId);
    if (isErr(result)) return result;

    const summary = toSummary(result.value);

    const outputsResult = await this.outputRepo.findBySession(id);
    if (!isErr(outputsResult)) {
      summary.agentOutputs = outputsResult.value;
    }

    return ok(summary);
  }

  async create(
    tenantId: string,
    profileId: string,
    problem: string,
  ): Promise<Result<SessionSummary, DomainError>> {
    const result = await this.repo.create({ tenantId, profileId, problem, status: 'pending', totalCostUsd: null, totalTokensIn: null, totalTokensOut: null });
    if (isErr(result)) return err(result.error);
    return ok(toSummary(result.value));
  }
}


