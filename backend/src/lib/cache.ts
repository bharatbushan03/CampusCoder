import type { Request, Response, NextFunction } from 'express';
import { getRedisClient, isRedisReady } from './redis';

interface MemoryCacheEntry<T> {
  value: T;
  expiresAt: number;
  tags: string[];
}

export interface CacheStats {
  hits: number;
  misses: number;
  l1MemoryKeys: number;
  redisConnected: boolean;
  invalidations: number;
}

class DualTierCache {
  private memoryStore = new Map<string, MemoryCacheEntry<any>>();
  private stats = {
    l1Hits: 0,
    l2Hits: 0,
    misses: 0,
    invalidations: 0,
  };
  private sweepInterval: NodeJS.Timeout | null = null;
  private keyPrefix = 'cc:cache:';
  private tagPrefix = 'cc:tag:';

  constructor() {
    // Run garbage collection sweep on local memory every 60 seconds
    this.sweepInterval = setInterval(() => this.sweepMemory(), 60_000);
    if (this.sweepInterval.unref) {
      this.sweepInterval.unref();
    }
  }

  /**
   * Fast synchronous lookup in L1 local memory only
   */
  public getSync<T>(key: string): T | null {
    const entry = this.memoryStore.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.memoryStore.delete(key);
      return null;
    }
    return entry.value as T;
  }

  /**
   * Dual-layer read: L1 Memory -> L2 Redis
   */
  public async get<T>(key: string): Promise<T | null> {
    // 1. Check L1 Memory
    const memEntry = this.memoryStore.get(key);
    if (memEntry) {
      if (Date.now() <= memEntry.expiresAt) {
        this.stats.l1Hits++;
        return memEntry.value as T;
      }
      this.memoryStore.delete(key);
    }

    // 2. Check L2 Redis if available
    const redis = getRedisClient();
    if (redis && isRedisReady()) {
      try {
        const raw = await redis.get(this.keyPrefix + key);
        if (raw) {
          this.stats.l2Hits++;
          const parsed = JSON.parse(raw);

          // Warm L1 memory cache with remaining TTL
          const ttlSeconds = await redis.ttl(this.keyPrefix + key);
          if (ttlSeconds > 0) {
            this.memoryStore.set(key, {
              value: parsed,
              expiresAt: Date.now() + ttlSeconds * 1000,
              tags: [],
            });
          }

          return parsed as T;
        }
      } catch (err) {
        console.warn('[Cache] Redis get error:', err);
      }
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Dual-layer write: L1 Memory + L2 Redis
   */
  public async set<T>(key: string, value: T, ttlSeconds: number, tags: string[] = []): Promise<void> {
    // 1. Set L1 Memory
    this.memoryStore.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
      tags,
    });

    // 2. Set L2 Redis with tag indexing
    const redis = getRedisClient();
    if (redis && isRedisReady()) {
      try {
        const payloadStr = JSON.stringify(value);
        const pipeline = redis.pipeline();

        // Store value with TTL
        pipeline.set(this.keyPrefix + key, payloadStr, 'EX', ttlSeconds);

        // Add to tag sets for group invalidation
        for (const tag of tags) {
          const tagKey = this.tagPrefix + tag;
          pipeline.sadd(tagKey, key);
          pipeline.expire(tagKey, Math.max(ttlSeconds * 2, 86400));
        }

        await pipeline.exec();
      } catch (err) {
        console.warn('[Cache] Redis set error:', err);
      }
    }
  }

  /**
   * Delete a key from L1 Memory and L2 Redis
   */
  public async delete(key: string): Promise<boolean> {
    const memoryDeleted = this.memoryStore.delete(key);

    const redis = getRedisClient();
    if (redis && isRedisReady()) {
      try {
        await redis.del(this.keyPrefix + key);
      } catch (err) {
        console.warn('[Cache] Redis del error:', err);
      }
    }

    return memoryDeleted;
  }

  /**
   * Invalidate all cached entries tagged with any of the provided tags
   */
  public async invalidateTags(tags: string[]): Promise<number> {
    if (!tags || tags.length === 0) return 0;

    const tagSet = new Set(tags);
    let count = 0;

    // 1. Invalidate in L1 Memory
    for (const [key, entry] of this.memoryStore.entries()) {
      const hasMatch = entry.tags.some((t) => tagSet.has(t));
      if (hasMatch) {
        this.memoryStore.delete(key);
        count++;
      }
    }

    // 2. Invalidate in L2 Redis via Tag Sets
    const redis = getRedisClient();
    if (redis && isRedisReady()) {
      try {
        for (const tag of tags) {
          const tagKey = this.tagPrefix + tag;
          const members = await redis.smembers(tagKey);

          if (members && members.length > 0) {
            const pipeline = redis.pipeline();
            for (const memberKey of members) {
              pipeline.del(this.keyPrefix + memberKey);
              this.memoryStore.delete(memberKey);
              count++;
            }
            pipeline.del(tagKey);
            await pipeline.exec();
          }
        }
      } catch (err) {
        console.warn('[Cache] Redis invalidateTags error:', err);
      }
    }

    this.stats.invalidations += count;
    return count;
  }

  /**
   * Clear all L1 memory entries
   */
  public clear(): void {
    this.memoryStore.clear();
  }

  /**
   * Telemetry statistics
   */
  public getStats() {
    const totalHits = this.stats.l1Hits + this.stats.l2Hits;
    const totalRequests = totalHits + this.stats.misses;
    const hitRatio = totalRequests > 0 ? `${((totalHits / totalRequests) * 100).toFixed(1)}%` : '0.0%';

    return {
      l1MemoryHits: this.stats.l1Hits,
      l2RedisHits: this.stats.l2Hits,
      totalHits,
      misses: this.stats.misses,
      hitRatio,
      l1MemoryKeys: this.memoryStore.size,
      redisConnected: isRedisReady(),
      invalidations: this.stats.invalidations,
      mode: isRedisReady() ? 'Dual-Tier (Memory L1 + Redis L2)' : 'In-Memory Fallback',
    };
  }

  private sweepMemory(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryStore.entries()) {
      if (now > entry.expiresAt) {
        this.memoryStore.delete(key);
      }
    }
  }
}

export const appCache = new DualTierCache();

/**
 * Express middleware for caching JSON responses with HTTP Cache-Control & Redis support
 * @param ttlSeconds TTL in seconds
 * @param tags Array of tags for grouped invalidation
 * @param httpMaxAge Client/CDN Cache-Control max-age in seconds (optional)
 */
export function cacheRoute(ttlSeconds: number, tags: string[] = [], httpMaxAge: number = 30) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache safe GET / HEAD requests
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return next();
    }

    const cacheKey = `http:${req.originalUrl || req.url}`;

    // Set standard HTTP caching headers for CDN / Browser
    res.setHeader('Cache-Control', `public, max-age=${httpMaxAge}, s-maxage=${ttlSeconds}, stale-while-revalidate=${ttlSeconds * 2}`);

    try {
      const cached = await appCache.get<any>(cacheKey);

      if (cached !== null) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }
    } catch (err) {
      console.warn('[Cache Middleware] Read error (continuing without cache):', err);
    }

    res.setHeader('X-Cache', 'MISS');

    // Intercept res.json to cache response payload
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      // Only cache successful 200 responses
      if (res.statusCode >= 200 && res.statusCode < 300 && body?.ok !== false) {
        appCache.set(cacheKey, body, ttlSeconds, tags).catch((err) => {
          console.warn('[Cache Middleware] Background set error:', err);
        });
      }
      return originalJson(body);
    };

    next();
  };
}
