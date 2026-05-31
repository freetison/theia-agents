const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class TtlCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();

  constructor(private readonly ttlMs: number = DEFAULT_TTL_MS) {}

  /**
   * Returns the cached value if fresh, otherwise calls loader, caches, and returns result.
   */
  async wrap(key: string, loader: () => Promise<T>): Promise<T> {
    const entry = this.store.get(key);
    const now = Date.now();

    if (entry !== undefined && entry.expiresAt > now) {
      return entry.value;
    }

    const value = await loader();
    this.store.set(key, { value, expiresAt: now + this.ttlMs });
    return value;
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  invalidateAll(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}
