import type { Request, Response, NextFunction } from 'express';

/**
 * Normalizes an origin or URL string to lowercase protocol://host (without trailing slash).
 * If protocol is missing, defaults to https://.
 */
export function normalizeOrigin(originStr: string): string {
  const trimmed = originStr.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withProto);
    return `${parsed.protocol}//${parsed.host}`.toLowerCase();
  } catch {
    return trimmed.toLowerCase();
  }
}

/**
 * Returns the list of trusted origins configured across all environment variables,
 * plus optional request-specific host origins (same-origin / reverse-proxy target host).
 */
export function getAllowedOrigins(req?: Request): string[] {
  const envSources = [
    process.env.CORS_ALLOWED_ORIGINS,
    process.env.FRONTEND_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
  ]
    .filter(Boolean)
    .join(',');

  const rawList = envSources ? envSources.split(',') : [];
  const origins = new Set<string>();

  // Always allow standard local dev origins
  origins.add('http://localhost:3000');
  origins.add('http://127.0.0.1:3000');

  // If request is provided, automatically trust the request's own target host and proxy host
  if (req) {
    const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';

    const hostHeader = req.get('host');
    if (hostHeader) {
      origins.add(normalizeOrigin(`${proto}://${hostHeader}`));
    }

    const forwardedHost = req.get('x-forwarded-host');
    if (forwardedHost) {
      const clientHost = forwardedHost.split(',')[0].trim();
      if (clientHost) {
        origins.add(normalizeOrigin(`${proto}://${clientHost}`));
      }
    }
  }

  for (const entry of rawList) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    if (trimmed.includes('*')) {
      origins.add(trimmed.toLowerCase().replace(/\/+$/, ''));
    } else {
      const normalized = normalizeOrigin(trimmed);
      if (normalized) origins.add(normalized);
    }
  }

  // Also auto-pair apex domains and www subdomains
  const additionalWww: string[] = [];
  for (const origin of origins) {
    try {
      const u = new URL(origin);
      if (u.hostname.startsWith('www.')) {
        const apexHost = u.hostname.replace(/^www\./, '');
        additionalWww.push(`${u.protocol}//${apexHost}${u.port ? ':' + u.port : ''}`);
      } else if (!u.hostname.includes('*') && u.hostname.includes('.') && u.hostname !== 'localhost' && !u.hostname.startsWith('127.')) {
        additionalWww.push(`${u.protocol}//www.${u.hostname}${u.port ? ':' + u.port : ''}`);
      }
    } catch {
      // ignore
    }
  }
  for (const extra of additionalWww) {
    origins.add(extra.toLowerCase());
  }

  return Array.from(origins);
}

/**
 * Checks if a candidate origin matches any allowed origin,
 * supporting exact host matches and wildcard subdomain patterns (e.g. *.vercel.app).
 */
export function isOriginAllowed(
  candidateOrigin: string,
  allowedOrigins: string[] = getAllowedOrigins()
): boolean {
  if (!candidateOrigin || candidateOrigin === 'null') {
    return false;
  }

  let candidateNormalized = '';
  let candidateHostname = '';
  let candidateProto = '';
  try {
    const parsed = new URL(candidateOrigin);
    candidateNormalized = `${parsed.protocol}//${parsed.host}`.toLowerCase();
    candidateHostname = parsed.hostname.toLowerCase();
    candidateProto = parsed.protocol.toLowerCase();
  } catch {
    candidateNormalized = candidateOrigin.trim().toLowerCase().replace(/\/+$/, '');
    candidateHostname = candidateNormalized;
  }

  return allowedOrigins.some((allowed) => {
    if (allowed.includes('*')) {
      try {
        const withProto = /^https?:\/\//i.test(allowed) ? allowed : `https://${allowed}`;
        const allowedUrl = new URL(withProto);
        const patternHost = allowedUrl.hostname.toLowerCase();
        if (/^https?:\/\//i.test(allowed) && candidateProto && candidateProto !== allowedUrl.protocol.toLowerCase()) {
          return false;
        }
        if (patternHost.startsWith('*.')) {
          const rootDomain = patternHost.slice(2);
          return candidateHostname === rootDomain || candidateHostname.endsWith(`.${rootDomain}`);
        }
      } catch {
        const regexStr = '^' + allowed.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$';
        return new RegExp(regexStr, 'i').test(candidateNormalized);
      }
    }
    return candidateNormalized === allowed.toLowerCase();
  });
}

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

  // Normalize origin / referer to origin base (protocol + host)
  let originHost = '';
  try {
    const parsed = new URL(origin);
    originHost = `${parsed.protocol}//${parsed.host}`;
  } catch {
    return res.status(403).json({ ok: false, error: 'CSRF validation failed: Malformed origin header.' });
  }

  const allowedOrigins = getAllowedOrigins(req);
  const isAllowed = isOriginAllowed(originHost, allowedOrigins);

  if (!isAllowed) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(
        `[CSRF] Untrusted origin blocked: "${originHost}". Configured allowed origins: [${allowedOrigins.join(', ')}]. Please configure FRONTEND_URL or CORS_ALLOWED_ORIGINS in your backend environment variables.`
      );
    }
    return res.status(403).json({
      ok: false,
      error: `CSRF validation failed: Untrusted origin (${originHost}). Configured allowed: [${allowedOrigins.join(', ')}]`,
    });
  }

  next();
}

