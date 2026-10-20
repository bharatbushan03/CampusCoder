import type { Request, Response, NextFunction } from 'express';

/**
 * Validates Origin and Referer on state-modifying requests (POST, PUT, PATCH, DELETE).
 * Provides CSRF defense for session-cookie authenticated endpoints.
 */
export function verifyCsrf(req: Request, res: Response, next: NextFunction) {
  const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);
  if (safeMethods.has(req.method)) {
    return next();
  }

  // Allow server-to-server requests bypassing browser CSRF if matching internal secret
  const internalSecret = process.env.INTERNAL_API_SECRET;
  const providedInternalSecret = req.headers['x-internal-secret'];
  if (internalSecret && providedInternalSecret === internalSecret) {
    return next();
  }

  const origin = (req.headers['origin'] || req.headers['referer']) as string | undefined;
  
  // If Origin or Referer is absent on browser mutating calls, check Sec-Fetch-Site if available
  const secFetchSite = req.headers['sec-fetch-site'] as string | undefined;
  if (secFetchSite === 'cross-site') {
    return res.status(403).json({ ok: false, error: 'CSRF validation failed: Cross-site request rejected.' });
  }

  if (!origin) {
    // Non-browser clients (e.g. CLI, automated tasks without origin) allowed if not cross-site
    return next();
  }

  const rawAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000';
  const allowedOrigins = rawAllowedOrigins
    .split(',')
    .map((url) => url.trim().replace(/\/$/, ''))
    .filter(Boolean);

  // Normalize origin / referer to origin base (protocol + host)
  let originHost = '';
  try {
    const parsed = new URL(origin);
    originHost = `${parsed.protocol}//${parsed.host}`;
  } catch {
    return res.status(403).json({ ok: false, error: 'CSRF validation failed: Malformed origin header.' });
  }

  const isAllowed = allowedOrigins.some((allowed) => {
    try {
      const allowedParsed = new URL(allowed);
      return originHost.toLowerCase() === `${allowedParsed.protocol}//${allowedParsed.host}`.toLowerCase();
    } catch {
      return originHost.toLowerCase() === allowed.toLowerCase();
    }
  });

  if (!isAllowed) {
    return res.status(403).json({ ok: false, error: 'CSRF validation failed: Untrusted origin.' });
  }

  next();
}
