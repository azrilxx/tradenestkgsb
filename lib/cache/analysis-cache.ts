/**
 * Analysis Result Caching
 * Implements in-memory caching with TTL for analysis results
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class AnalysisCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 15 * 60 * 1000; // 15 minutes

  /**
   * Generate cache key from parameters
   */
  private generateKey(alertId: string, timeWindow: number, filters?: Record<string, any>): string {
    const filterStr = filters ? JSON.stringify(filters) : '';
    return `analysis:${alertId}:${timeWindow}:${filterStr}`;
  }

  /**
   * Check if entry exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) return false;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;

    if (isExpired) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    if (!this.has(key)) return null;

    const entry = this.cache.get(key);
    return entry ? entry.data : null;
  }

  /**
   * Set cache data
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Cache analysis result
   */
  cacheAnalysis(alertId: string, timeWindow: number, data: any, filters?: Record<string, any>): void {
    const key = this.generateKey(alertId, timeWindow, filters);
    this.set(key, data);
  }

  /**
   * Get cached analysis result
   */
  getCachedAnalysis(alertId: string, timeWindow: number, filters?: Record<string, any>): any | null {
    const key = this.generateKey(alertId, timeWindow, filters);
    return this.get(key);
  }

  /**
   * Invalidate cache for specific alert
   */
  invalidate(alertId: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.includes(alertId)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    return keysToDelete.length;
  }
}

// Singleton instance
export const analysisCache = new AnalysisCache();

// Periodic cleanup (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    analysisCache.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * Memoize analysis function with caching
 */
export function memoizeAnalysis<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  ttl: number = 15 * 60 * 1000
): T {
  return async (...args: any[]): Promise<any> => {
    const key = JSON.stringify(args);

    // Check cache
    const cached = analysisCache.get(key);
    if (cached) {
      console.log('[Cache Hit]', key);
      return cached;
    }

    // Execute and cache
    const result = await fn(...args);
    analysisCache.set(key, result, ttl);
    console.log('[Cache Miss]', key);

    return result;
  };
}

export default analysisCache;

