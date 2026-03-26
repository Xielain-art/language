/**
 * In-memory cache service with TTL support.
 * Reduces Supabase API calls for frequently accessed, rarely changed data.
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const DEFAULT_TTL_MS = 5 * 60 * 1000 // 5 minutes

class CacheService {
  private cache = new Map<string, CacheEntry<any>>()

  /**
   * Get a value from cache. Returns undefined if not found or expired.
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return undefined
    }

    return entry.data as T
  }

  /**
   * Set a value in cache with optional TTL (defaults to 5 minutes).
   */
  set<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    })
  }

  /**
   * Delete a specific key from cache.
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cached data.
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get a value from cache, or fetch it using the provided function if not cached.
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T | null>,
    ttlMs: number = DEFAULT_TTL_MS
  ): Promise<T | null> {
    const cached = this.get<T>(key)
    if (cached !== undefined) return cached

    const data = await fetchFn()
    if (data !== null) {
      this.set(key, data, ttlMs)
    }
    return data
  }

  /**
   * Invalidate all keys matching a prefix.
   */
  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key)
      }
    }
  }
}

// Singleton instance
export const cache = new CacheService()

// Cache key generators
export const CacheKeys = {
  botSetting: (key: string) => `bot_setting:${key}`,
  prompt: (code: string) => `prompt:${code}`,
  aiModel: (code: string) => `ai_model:${code}`,
  activeModels: () => 'ai_models:active',
} as const