import dns from 'node:dns';
import Redis, { type RedisOptions } from 'ioredis';
import { CircuitBreaker } from './circuitBreaker';

// Force IPv4 DNS lookup order to prevent IPv6/NAT64 route hangs
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

export const redisCircuitBreaker = new CircuitBreaker({
  name: 'RedisCache',
  failureThreshold: 2,
  recoveryTimeoutMs: 20_000,
});

let redisClient: Redis | null = null;

function buildRedisOptions(): { url?: string; options: RedisOptions } {
  const redisUrl = process.env.REDIS_URL;

  const baseOptions: RedisOptions = {
    lazyConnect: true,
    family: 4, // Force IPv4 to avoid IPv6/NAT64 hangs
    keepAlive: 5000, // 5s TCP keepalive
    maxRetriesPerRequest: 1, // Fail fast so cache lookups never block HTTP threads
    enableOfflineQueue: false, // Don't buffer commands when offline/reconnecting
    autoResendUnfulfilledCommands: false,
    connectTimeout: 3000,
    disconnectTimeout: 1000,
    commandTimeout: 500, // Strict 500ms command timeout
    retryStrategy(times: number) {
      if (times > 10) {
        return Math.min(times * 500, 5000);
      }
      return Math.min(times * 200, 1500);
    },
    reconnectOnError(_err) {
      return true; // Always auto-reconnect on socket errors
    },
  };

  if (redisUrl) {
    const isTls = redisUrl.startsWith('rediss://');
    return {
      url: redisUrl,
      options: {
        ...baseOptions,
        tls: isTls ? { rejectUnauthorized: false } : undefined,
      },
    };
  }

  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  const password = process.env.REDIS_PASSWORD || undefined;
  const tls = process.env.REDIS_TLS === 'true' ? { rejectUnauthorized: false } : undefined;

  return {
    options: {
      ...baseOptions,
      host,
      port,
      password,
      tls,
    },
  };
}

export function initRedis(): Redis | null {
  if (redisClient) return redisClient;

  // Don't attempt to connect if explicitly disabled
  if (process.env.DISABLE_REDIS === 'true') {
    console.log('[Redis] Redis cache disabled via DISABLE_REDIS=true. Operating in memory-only mode.');
    return null;
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl && !process.env.REDIS_HOST) {
    return null;
  }

  try {
    const { url, options } = buildRedisOptions();

    redisClient = url ? new Redis(url, options) : new Redis(options);

    redisClient.on('connect', () => {
      redisCircuitBreaker.recordSuccess();
      console.log('[Redis] 🟢 Connected to Redis cache service.');
    });

    redisClient.on('ready', () => {
      redisCircuitBreaker.recordSuccess();
      console.log('[Redis] ⚡ Redis client is ready to accept commands.');
    });

    redisClient.on('error', (err: any) => {
      const errMsg = err?.message || String(err);
      if (errMsg.includes('Command timed out') || errMsg.includes('timeout')) {
        redisCircuitBreaker.recordFailure(err);
      } else if (err?.code === 'ECONNREFUSED' || errMsg.includes('ECONNREFUSED')) {
        redisCircuitBreaker.recordFailure(err);
      }
    });

    // Initiate non-blocking connection
    redisClient.connect().catch((_err) => {
      redisCircuitBreaker.recordFailure(_err);
      console.warn('[Redis] 🟡 Notice: Redis unavailable on startup. Active fallback: in-memory caching.');
    });

    return redisClient;
  } catch (err: any) {
    redisClient = null;
    redisCircuitBreaker.recordFailure(err);
    console.warn('[Redis] Initialization error (falling back to memory cache):', err?.message || err);
    return null;
  }
}

export function getRedisClient(): Redis | null {
  if (!redisClient) {
    return initRedis();
  }
  return redisClient;
}

export function isRedisReady(): boolean {
  if (!redisClient || redisClient.status !== 'ready') {
    return false;
  }
  return redisCircuitBreaker.allowRequest();
}

export async function pingRedis(): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
  const client = getRedisClient();
  if (!client || client.status === 'end' || client.status === 'close') {
    return { ok: false, error: 'Redis client not connected (operating in in-memory fallback mode)' };
  }

  const start = performance.now();
  try {
    const pingPromise = client.ping();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Ping timeout (500ms)')), 500)
    );

    const res = await Promise.race([pingPromise, timeoutPromise]);
    const latencyMs = parseFloat((performance.now() - start).toFixed(2));
    redisCircuitBreaker.recordSuccess();
    return { ok: res === 'PONG', latencyMs };
  } catch (err: any) {
    redisCircuitBreaker.recordFailure(err);
    return { ok: false, error: err.message || 'Ping failed' };
  }
}

// Background Keepalive & Circuit Breaker Health Prober (non-blocking, keeps TLS warm)
if (typeof setInterval !== 'undefined') {
  const proberTimer = setInterval(async () => {
    if (redisClient && (redisClient.status === 'ready' || redisClient.status === 'connect')) {
      try {
        await Promise.race([
          redisClient.ping(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Prober timeout')), 400))
        ]);
        redisCircuitBreaker.recordSuccess();
      } catch (err) {
        redisCircuitBreaker.recordFailure(err);
      }
    }
  }, 20_000);

  if (proberTimer.unref) {
    proberTimer.unref();
  }
}

// Auto-initialize on module load
initRedis();



