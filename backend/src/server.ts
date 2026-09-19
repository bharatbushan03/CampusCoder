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
import { globalRateLimiter } from './middleware/rateLimit';
import { appCache } from './lib/cache';
import { backgroundQueue } from './lib/queue';
import { pingRedis } from './lib/redis';
import { checkAzureDb, initAzureTables, isAzureDbConfigured } from './lib/azureDb';
import { isAzureStorageConfigured } from './lib/azureStorage';

const PORT = process.env.PORT || process.env.BACKEND_PORT || 4000;
const startTime = Date.now();
const allowedOrigins = (process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
  .split(',')
  .map(url => url.trim())
  .filter(Boolean);

// Always ensure localhost is allowed for local dev/testing
if (!allowedOrigins.includes('http://localhost:3000')) {
  allowedOrigins.push('http://localhost:3000');
}

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server or same-origin)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive callback for API endpoints while keeping credentials support
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Global Rate Limiting
app.use(globalRateLimiter);

// High-precision Request Latency Logger
app.use((req, res, next) => {
  const startHr = process.hrtime();
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(startHr);
    const durationMs = (seconds * 1000 + nanoseconds / 1e6).toFixed(2);
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl || req.path} ${res.statusCode} - ${durationMs}ms`);
    }
  });
  next();
});

app.get('/', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: 'campuscoder-backend',
    version: '0.1.0',
    docs: '/health',
  });
});

app.use('/health', async (_req: Request, res: Response) => {
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
app.use('/api/admin', adminRouter);
app.use('/api/admin/emails', emailsRouter);
app.use('/api/admin/upload', uploadRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ ok: false, error: 'Not Found' });
});

app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    ok: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : (err.message || 'Internal Server Error'),
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
