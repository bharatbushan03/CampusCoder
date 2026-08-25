import type { Request, Response, NextFunction } from 'express';
import { getRedisClient, isRedisReady } from '../lib/redis';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

interface RateLimitOptions {
  windowMs: number;
  max: number;
  prefix?: string;
  message?: string;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
}

export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    prefix = 'rl',
    message = 'Too many requests, please try again later.',
    keyGenerator = (req: Request) => {
      const forwarded = req.headers['x-forwarded-for'];
      if (typeof forwarded === 'string') {
        return forwarded.split(',')[0].trim();
      }
      return req.ip || req.socket.remoteAddress || 'unknown';
    },
    skip = () => false,
  } = options;

  const memoryHits = new Map<string, RateLimitRecord>();

  // Cleanup expired memory entries periodically
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryHits.entries()) {
      if (now > record.resetTime) {
        memoryHits.delete(key);
      }
    }
  }, 60_000);

  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }

  return async (req: Request, res: Response, next: NextFunction) => {
    if (skip(req)) {
      return next();
    }

    const ipKey = keyGenerator(req);
    const redis = getRedisClient();

    // 1. Distributed Rate Limiting via Redis
    if (redis && isRedisReady()) {
      try {
        const redisKey = `cc:ratelimit:${prefix}:${ipKey}`;
        const windowSeconds = Math.ceil(windowMs / 1000);

        const pipeline = redis.pipeline();
        pipeline.incr(redisKey);
        pipeline.ttl(redisKey);

        const results = await pipeline.exec();
        if (results && results[0] && results[1]) {
          const currentCount = results[0][1] as number;
          let ttl = results[1][1] as number;

          // If key was just created without a TTL, assign window TTL
          if (ttl === -1) {
            await redis.expire(redisKey, windowSeconds);
            ttl = windowSeconds;
          }

          const resetSeconds = ttl > 0 ? ttl : windowSeconds;
          const remaining = Math.max(0, max - currentCount);

          res.setHeader('RateLimit-Limit', max);
          res.setHeader('RateLimit-Remaining', remaining);
          res.setHeader('RateLimit-Reset', resetSeconds);

          if (currentCount > max) {
            res.setHeader('Retry-After', resetSeconds);
            return res.status(429).json({
              ok: false,
              error: message,
              retryAfter: resetSeconds,
            });
          }

          return next();
        }
      } catch (err) {
        console.warn('[RateLimiter] Redis error (falling back to memory):', err);
      }
    }

    // 2. Fallback: In-Memory Sliding-Window Limiter
    const now = Date.now();
    const existing = memoryHits.get(ipKey);

    if (!existing || now > existing.resetTime) {
      memoryHits.set(ipKey, { count: 1, resetTime: now + windowMs });
      res.setHeader('RateLimit-Limit', max);
      res.setHeader('RateLimit-Remaining', max - 1);
      res.setHeader('RateLimit-Reset', Math.ceil(windowMs / 1000));
      return next();
    }

    existing.count++;

    const remaining = Math.max(0, max - existing.count);
    const resetSeconds = Math.ceil((existing.resetTime - now) / 1000);

    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset', resetSeconds);

    if (existing.count > max) {
      res.setHeader('Retry-After', resetSeconds);
      return res.status(429).json({
        ok: false,
        error: message,
        retryAfter: resetSeconds,
      });
    }

    next();
  };
}

// Preconfigured rate limiters
export const globalRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute per IP
  prefix: 'global',
  message: 'Too many requests from this IP. Please wait a minute before making more requests.',
  skip: (req: Request) => req.path === '/health' || req.path === '/',
});

export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // 15 auth attempts per minute per IP
  prefix: 'auth',
  message: 'Too many authentication attempts. Please wait 60 seconds before trying again.',
});

export const registrationRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 registration attempts per minute per IP
  prefix: 'rsvp',
  message: 'Too many event registration attempts. Please wait a minute.',
});

export const likeRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 likes per minute per IP
  prefix: 'like',
  message: 'Too many likes submitted. Please wait a moment.',
});
