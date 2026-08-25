import Redis, { type RedisOptions } from 'ioredis';

let redisClient: Redis | null = null;
let isConnected = false;
let connectionAttempted = false;

function buildRedisOptions(): { url?: string; options: RedisOptions } {
  const redisUrl = process.env.REDIS_URL;

  const baseOptions: RedisOptions = {
    lazyConnect: true,
    maxRetriesPerRequest: 2,
    enableOfflineQueue: false,
    connectTimeout: 5000,
    disconnectTimeout: 2000,
    commandTimeout: 3000,
    retryStrategy(times: number) {
      if (times > 10) {
        // Stop reconnect spamming if Redis is permanently unavailable
        return null;
      }
      return Math.min(times * 200, 2000);
    },
  };

  if (redisUrl) {
    return { url: redisUrl, options: baseOptions };
  }

  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  const password = process.env.REDIS_PASSWORD || undefined;
  const tls = process.env.REDIS_TLS === 'true' ? {} : undefined;

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
  if (connectionAttempted && !isConnected) return null;

  connectionAttempted = true;

  // Don't attempt to connect if explicitly disabled
  if (process.env.DISABLE_REDIS === 'true') {
    console.log('[Redis] Redis cache disabled via DISABLE_REDIS=true. Operating in memory-only mode.');
    return null;
  }

  try {
    const { url, options } = buildRedisOptions();

    redisClient = url ? new Redis(url, options) : new Redis(options);

    redisClient.on('connect', () => {
      isConnected = true;
      console.log('[Redis] 🟢 Connected to Redis cache service.');
    });

    redisClient.on('ready', () => {
      isConnected = true;
      console.log('[Redis] ⚡ Redis client is ready to accept commands.');
    });

    redisClient.on('error', (err) => {
      isConnected = false;
      // Suppress ECONNREFUSED spam in local dev if Redis is not running
      if ((err as any)?.code === 'ECONNREFUSED' || (err as any)?.message?.includes('ECONNREFUSED')) {
        if (!connectionAttempted) {
          console.warn('[Redis] 🟡 Redis server not detected. Operating with automatic in-memory fallback.');
        }
      } else {
        console.warn('[Redis] Warning:', err?.message || err);
      }
    });

    redisClient.on('close', () => {
      isConnected = false;
    });

    // Initiate non-blocking connection
    redisClient.connect().catch((err) => {
      isConnected = false;
      console.warn('[Redis] 🟡 Notice: Redis unavailable on startup. Active fallback: in-memory caching.');
    });

    return redisClient;
  } catch (err: any) {
    isConnected = false;
    redisClient = null;
    console.warn('[Redis] Initialization error (falling back to memory cache):', err?.message || err);
    return null;
  }
}

export function getRedisClient(): Redis | null {
  if (!redisClient && !connectionAttempted) {
    return initRedis();
  }
  return isConnected ? redisClient : null;
}

export function isRedisReady(): boolean {
  return isConnected && redisClient !== null && redisClient.status === 'ready';
}

export async function pingRedis(): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
  const client = getRedisClient();
  if (!client) {
    return { ok: false, error: 'Redis client not connected (operating in in-memory fallback mode)' };
  }

  const start = performance.now();
  try {
    const res = await client.ping();
    const latencyMs = parseFloat((performance.now() - start).toFixed(2));
    return { ok: res === 'PONG', latencyMs };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Ping failed' };
  }
}

// Auto-initialize on module load
initRedis();
