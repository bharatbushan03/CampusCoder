import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authRouter } from './routes/auth';
import { eventsRouter } from './routes/events';
import { meRouter } from './routes/me';
import { adminRouter } from './routes/admin';
import { emailsRouter } from './routes/emails';
import { uploadRouter } from './routes/upload';

const PORT = process.env.BACKEND_PORT || process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

const app = express();

app.use(
  cors({
    origin: [FRONTEND_URL, 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
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

app.use('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'campuscoder-backend', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/me', meRouter);
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
    error: err.message || 'Internal Server Error',
  });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`CampusCoder Backend running on http://localhost:${PORT}`);
});

export default app;
