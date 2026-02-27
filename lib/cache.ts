// In-process memory cache with TTL
// Works across all Next.js API route invocations within the same process instance.
// On Vercel, this persists for the lifetime of a serverless function "warm" instance.

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  invalidatePrefix(prefix: string): void {
    const keys = Array.from(this.store.keys());
    for (const key of keys) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  size(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  ttlRemaining(key: string): number | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    const remaining = entry.expiresAt - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 1000) : null;
  }
}

// Singleton – shared across all API route handlers in the same process
export const cache = new MemoryCache();

// Cache key constants
export const CACHE_KEYS = {
  FEED_ALL: 'feed:all',
  FEED_TWEETS: 'feed:tweets',
  FEED_NEWS: 'feed:news',
  TRENDING: 'trending',
  SIDEBAR_STATS: 'sidebar:stats',
  KEYWORD_COUNTS: 'keywords',
  ADMIN_STATS: 'admin:stats',
  TOP_DISRUPTION: 'top:disruption',
} as const;

// TTL constants (seconds)
export const CACHE_TTL = {
  FEED: 30 * 60,        // 30 minutes
  TRENDING: 15 * 60,    // 15 minutes
  ADMIN: 5 * 60,        // 5 minutes
  KEYWORDS: 20 * 60,    // 20 minutes
} as const;
