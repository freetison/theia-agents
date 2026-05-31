import { describe, it, expect } from 'vitest';
import { HealthController } from '../health/health.controller';

describe('HealthController', () => {
  const controller = new HealthController();

  it('returns status ok', () => {
    const result = controller.check();
    expect(result.status).toBe('ok');
  });

  it('returns a valid ISO timestamp', () => {
    const result = controller.check();
    expect(() => new Date(result.timestamp)).not.toThrow();
    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
  });

  it('returns a version string', () => {
    const result = controller.check();
    expect(typeof result.version).toBe('string');
  });
});
