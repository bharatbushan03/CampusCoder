import dns from 'node:dns';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Force IPv4-first DNS resolution to prevent ConnectTimeoutError (UND_ERR_CONNECT_TIMEOUT)
// when connecting to Supabase and other cloud services on networks with non-routable IPv6/NAT64.
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authRouter } from './routes/auth';
import { eventsRouter } from './routes/events';
import { meRouter } from './routes/me';
import { adminRouter } from './routes/admin';
import { emailsRouter } from './routes/emails';
import { uploadRouter } from './routes/upload';
import { showcaseRouter } from './routes/showcase';
import { resourcesRouter } from './routes/resources';
import { competitionsRouter } from './routes/competitions';
import { notesRouter } from './routes/notes';
import { clubsRouter } from './routes/clubs';
import { collegesRouter } from './routes/colleges';
import { globalRateLimiter } from './middleware/rateLimit';
import { appCache } from './lib/cache';
import { backgroundQueue } from './lib/queue';
import { pingRedis } from './lib/redis';
import { checkAzureDb, initAzureTables, isAzureDbConfigured } from './lib/azureDb';
import { isAzureStorageConfigured } from './lib/azureStorage';

import { requireAuth, requireRole } from './middleware/auth';
import { verifyCsrf } from './middleware/csrf';

const PORT = process.env.PORT || process.env.BACKEND_PORT || 4000;
const startTime = Date.now();

const rawAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS || process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const allowedOriginsSet = new Set(
  rawAllowedOrigins
    .split(',')
    .map((url) => url.trim().replace(/\/$/, ''))
    .filter(Boolean)
);
// Ensure localhost is allowed for local development
allowedOriginsSet.add('http://localhost:3000');

const app = express();

// Trust reverse proxy hops (1 = Next.js / AWS ALB / Cloudflare)
app.set('trust proxy', 1);

// Standard HTTP Security Headers
app.use((_req: Request, res: Response, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      // Reject literal 'null' origin (sandboxed iframes, file://, data: URIs)
      if (origin === 'null') {
        return callback(null, false);
      }
      // Allow non-browser requests without Origin header (e.g. server-to-server, curl)
      if (!origin) {
        return callback(null, true);
      }
      const normalized = origin.trim().replace(/\/$/, '');
      if (allowedOriginsSet.has(normalized)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With', 'X-Internal-Secret'],
    exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset', 'Retry-After'],
    maxAge: 86400,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

import { recordRequestLog } from './lib/systemMonitor';

// Global Rate Limiting
app.use(globalRateLimiter);

// High-precision Request Latency Logger & System Monitor Recorder
app.use((req, res, next) => {
  const startHr = process.hrtime();
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(startHr);
    const durationMs = Number((seconds * 1000 + nanoseconds / 1e6).toFixed(2));
    recordRequestLog(req.method, req.originalUrl || req.path, res.statusCode, durationMs);
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl || req.path} ${res.statusCode} - ${durationMs}ms`);
    }
  });
  next();
});

// CSRF Origin verification on all mutating requests under /api
app.use('/api', verifyCsrf);

app.get('/', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: 'campuscoder-backend',
    version: '0.1.0',
  });
});

// Public liveness probe: Sanitized, no infrastructure or memory metrics exposed
app.get(['/health', '/api/health'], (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: 'campuscoder-backend',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Authenticated Administrator-only detailed telemetry endpoint
app.get('/api/admin/system/health', requireAuth, requireRole('admin'), async (_req: Request, res: Response) => {
  const mem = process.memoryUsage();
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  const redisHealth = await pingRedis();
  const azureDbHealth = await checkAzureDb();

  res.json({
    ok: true,
    service: 'campuscoder-backend',
    version: '0.1.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds,
    memory: {
      heapUsedMB: (mem.heapUsed / 1024 / 1024).toFixed(2),
      heapTotalMB: (mem.heapTotal / 1024 / 1024).toFixed(2),
      rssMB: (mem.rss / 1024 / 1024).toFixed(2),
    },
    cache: appCache.getStats(),
    redis: redisHealth,
    azureDb: azureDbHealth,
    azureStorage: { configured: isAzureStorageConfigured() },
    queue: backgroundQueue.getStats(),
  });
});

app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/competitions', competitionsRouter);
app.use('/api/notes', notesRouter);
app.use('/api/me', meRouter);
app.use('/api/showcase', showcaseRouter);
app.use('/api/clubs', clubsRouter);
app.use('/api/colleges', collegesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/admin/emails', emailsRouter);
app.use('/api/admin/upload', uploadRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ ok: false, error: 'Not Found' });
});

app.use((err: any, _req: Request, res: Response, _next: any) => {
  const isProduction = process.env.NODE_ENV === 'production';
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    ok: false,
    error: isProduction ? 'Internal Server Error' : (err.message || 'Internal Server Error'),
  });
});

const server = app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`CampusCoder Backend running on http://localhost:${PORT}`);
  if (isAzureDbConfigured()) {
    checkAzureDb().then(async (status) => {
      if (status.connected) {
        console.log(`[Azure DB] Connected successfully (${status.latencyMs}ms)`);
        await initAzureTables();
      } else {
        console.warn(`[Azure DB] Status: ${status.error || 'unreachable'}. Resilient Supabase fallback active.`);
      }
    });
  } else {
    console.log('[Azure DB] Not configured; using Supabase.');
  }
});

// Increase socket & request timeouts to 10 minutes to comfortably allow 500MB uploads without socket disconnects
server.requestTimeout = 10 * 60 * 1000;
server.headersTimeout = 10 * 60 * 1000 + 5000;
server.keepAliveTimeout = 10 * 60 * 1000;

export default app;
