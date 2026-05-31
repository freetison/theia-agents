import { describe, it, expect } from 'vitest';
import { AgentsService } from '../agents/agents.service';
import { isErr } from '@theia-core/result';

describe('AgentsService', () => {
  const service = new AgentsService();

  it('run returns err INTERNAL (engine not yet integrated)', async () => {
    const result = await service.run({
      sessionId: 'session-1',
      profileId: 'profile-a',
      problem: 'Test problem',
      tenantId: 'tenant-1',
    });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.code).toBe('INTERNAL');
  });

  it('streamProgress yields nothing (stub)', async () => {
    const events: unknown[] = [];
    for await (const event of service.streamProgress('session-1')) {
      events.push(event);
    }
    expect(events).toHaveLength(0);
  });
});
