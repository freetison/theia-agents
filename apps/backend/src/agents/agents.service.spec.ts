import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firstValueFrom, toArray } from 'rxjs';
import { ok, err, isOk, isErr } from '@theia-core/result';
import { AgentEngineService } from '../agents/agent-engine.service';
import { SessionStreamRegistry } from '../agents/session-stream.registry';
import { theiaEvents } from '@theia/engine';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@theia/engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@theia/engine')>();
  return {
    ...actual,
    buildGraph: vi.fn(() => ({
      invoke: vi.fn().mockResolvedValue({ finalReport: { verdict: 'GO', viability_score: 8 } }),
    })),
  };
});

const mockProfileRepo = {
  findAll: vi.fn(),
  findById: vi.fn(),
  findBySlug: vi.fn(),
  upsert: vi.fn(),
};

const mockSessionRepo = {
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  updateStatus: vi.fn(),
};

const mockOutputRepo = {
  upsert: vi.fn(),
  findBySession: vi.fn(),
};

const TENANT = 'tenant-1';
const SESSION_ID = 'session-1';
const PROFILE_ID = 'profile-uuid-1';

const fakeProfileRow = {
  id: PROFILE_ID,
  tenantId: TENANT,
  slug: 'it',
  name: 'IT Profile',
  description: null,
  version: 1,
  isActive: true,
  agents: [
    { agentId: 'biz_evaluator', sequence: 1, context: null, requires: [] },
    { agentId: 'synthesizer', sequence: 2, context: null, requires: [] },
  ],
};

const fakeSessionRow = {
  id: SESSION_ID,
  tenantId: TENANT,
  profileId: PROFILE_ID,
  problem: 'Test problem',
  status: 'running' as const,
  startedAt: new Date().toISOString(),
  finishedAt: null,
  totalCostUsd: null,
  totalTokensIn: null,
  totalTokensOut: null,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AgentEngineService', () => {
  let service: AgentEngineService;
  let registry: SessionStreamRegistry;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProfileRepo.findById.mockResolvedValue(ok(fakeProfileRow));
    mockSessionRepo.create.mockResolvedValue(ok(fakeSessionRow));
    mockSessionRepo.updateStatus.mockResolvedValue(ok(undefined));
    mockOutputRepo.upsert.mockResolvedValue(ok({ id: 'output-1' }));

    registry = new SessionStreamRegistry();
    service = new AgentEngineService(
      mockProfileRepo as any,
      mockSessionRepo as any,
      mockOutputRepo as any,
      registry,
    );
  });

  it('run returns ok when engine succeeds', async () => {
    const result = await service.run({
      sessionId: SESSION_ID,
      profileId: PROFILE_ID,
      problem: 'Test problem',
      tenantId: TENANT,
    });
    expect(isOk(result)).toBe(true);
  });

  it('run creates session record before invoking graph', async () => {
    await service.run({
      sessionId: SESSION_ID,
      profileId: PROFILE_ID,
      problem: 'Test problem',
      tenantId: TENANT,
    });
    expect(mockSessionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: SESSION_ID, status: 'running' }),
    );
  });

  it('run returns err when profile not found', async () => {
    mockProfileRepo.findById.mockResolvedValue(
      err({ code: 'NOT_FOUND', message: 'not found', details: {} }),
    );
    const result = await service.run({
      sessionId: SESSION_ID,
      profileId: PROFILE_ID,
      problem: 'Test',
      tenantId: TENANT,
    });
    expect(isErr(result)).toBe(true);
  });

  it('run updates session to completed on success', async () => {
    await service.run({
      sessionId: SESSION_ID,
      profileId: PROFILE_ID,
      problem: 'Test',
      tenantId: TENANT,
    });
    expect(mockSessionRepo.updateStatus).toHaveBeenCalledWith(
      SESSION_ID,
      TENANT,
      'completed',
      expect.any(Object),
    );
  });

  it('run updates session to failed when engine throws', async () => {
    const { buildGraph } = await import('@theia/engine');
    (buildGraph as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      invoke: vi.fn().mockRejectedValue(new Error('engine error')),
    });

    const result = await service.run({
      sessionId: SESSION_ID,
      profileId: PROFILE_ID,
      problem: 'Test',
      tenantId: TENANT,
    });
    expect(isErr(result)).toBe(true);
    expect(mockSessionRepo.updateStatus).toHaveBeenCalledWith(
      SESSION_ID,
      TENANT,
      'failed',
      expect.any(Object),
    );
  });

  it('streamProgress returns Observable from registry', () => {
    const obs = service.streamProgress(SESSION_ID);
    expect(typeof obs.subscribe).toBe('function');
  });

  it('onAgentDone persists output when theiaEvents fires with sessionId', async () => {
    // Start a run to register the session in the registry
    const runPromise = service.run({
      sessionId: SESSION_ID,
      profileId: PROFILE_ID,
      problem: 'Test',
      tenantId: TENANT,
    });

    // Emit a theiaEvents event before resolve (simulates engine mid-run)
    theiaEvents.emit('agent:done', {
      sessionId: SESSION_ID,
      agent: 'biz_evaluator',
      role: 'bizEvaluator',
      timestamp: new Date().toISOString(),
      summary: 'Business analysis done',
      data: { bizOutput: { confidence: 0.8 } },
    });

    await runPromise;

    expect(mockOutputRepo.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: SESSION_ID, agentId: 'biz_evaluator' }),
    );
  });

  it('onAgentDone ignores events without sessionId', async () => {
    theiaEvents.emit('agent:done', {
      agent: 'biz_evaluator',
      role: 'bizEvaluator',
      timestamp: new Date().toISOString(),
      summary: 'No session',
      data: {},
    });
    // No upsert called for orphaned event
    expect(mockOutputRepo.upsert).not.toHaveBeenCalled();
  });
});

