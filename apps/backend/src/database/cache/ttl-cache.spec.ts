import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TtlCache } from '../cache/ttl-cache';

describe('TtlCache', () => {
  let cache: TtlCache<string>;

  beforeEach(() => {
    cache = new TtlCache<string>(100); // 100ms TTL for fast expiry tests
  });

  it('calls loader on cache miss', async () => {
    const loader = vi.fn().mockResolvedValue('value-1');
    const result = await cache.wrap('key', loader);
    expect(result).toBe('value-1');
    expect(loader).toHaveBeenCalledOnce();
  });

  it('returns cached value on cache hit without calling loader again', async () => {
    const loader = vi.fn().mockResolvedValue('value-1');
    await cache.wrap('key', loader);
    const result = await cache.wrap('key', loader);
    expect(result).toBe('value-1');
    expect(loader).toHaveBeenCalledOnce();
  });

  it('calls loader again after TTL expires', async () => {
    const loader = vi.fn().mockResolvedValue('fresh');
    await cache.wrap('key', loader);

    await new Promise((r) => setTimeout(r, 150)); // wait past TTL

    const result = await cache.wrap('key', loader);
    expect(result).toBe('fresh');
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('invalidate forces reload on next call', async () => {
    const loader = vi.fn().mockResolvedValue('v');
    await cache.wrap('key', loader);
    cache.invalidate('key');
    await cache.wrap('key', loader);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('invalidateAll forces reload for all keys', async () => {
    const loader1 = vi.fn().mockResolvedValue('a');
    const loader2 = vi.fn().mockResolvedValue('b');
    await cache.wrap('k1', loader1);
    await cache.wrap('k2', loader2);
    cache.invalidateAll();
    await cache.wrap('k1', loader1);
    await cache.wrap('k2', loader2);
    expect(loader1).toHaveBeenCalledTimes(2);
    expect(loader2).toHaveBeenCalledTimes(2);
  });

  it('different keys are cached independently', async () => {
    const loaderA = vi.fn().mockResolvedValue('a');
    const loaderB = vi.fn().mockResolvedValue('b');
    expect(await cache.wrap('ka', loaderA)).toBe('a');
    expect(await cache.wrap('kb', loaderB)).toBe('b');
    // hit both again
    expect(await cache.wrap('ka', loaderA)).toBe('a');
    expect(await cache.wrap('kb', loaderB)).toBe('b');
    expect(loaderA).toHaveBeenCalledOnce();
    expect(loaderB).toHaveBeenCalledOnce();
  });
});
