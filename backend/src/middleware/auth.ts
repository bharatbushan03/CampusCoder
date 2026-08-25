import type { NextFunction, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';
import { getSupabasePublicKey, getSupabaseUrl } from '../utils/supabase/config';
import { clearSessionCookies, REFRESH_COOKIE, SESSION_COOKIE, setSessionCookies } from '../lib/session';

import { createAdminClient } from '../utils/supabase/admin';
import { appCache } from '../lib/cache';

export interface AuthedRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
  profile?: {
    id: string;
    email?: string | null;
    role: string;
    full_name?: string | null;
  } | null;
}

let anonClientInstance: ReturnType<typeof createClient<Database>> | null = null;

export function createAnonClient() {
  if (anonClientInstance) {
    return anonClientInstance;
  }
  anonClientInstance = createClient<Database>(getSupabaseUrl(), getSupabasePublicKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return anonClientInstance;
}

export async function invalidateAuthSession(accessToken?: string) {
  if (accessToken) {
    await appCache.delete(`auth_session:${accessToken}`);
  } else {
    await appCache.invalidateTags(['auth_sessions']);
  }
}

export function createUserClient(accessToken: string) {
  return createClient<Database>(getSupabaseUrl(), getSupabasePublicKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

export function getUserAccessToken(req: AuthedRequest) {
  return req.cookies?.[SESSION_COOKIE] as string | undefined;
}

async function loadUser(req: AuthedRequest, res: Response) {
  const supabase = createAnonClient();

  const accessToken = req.cookies?.[SESSION_COOKIE] as string | undefined;
  const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;

  if (!accessToken) {
    if (refreshToken) {
      try {
        const refreshed = await supabase.auth.refreshSession({ refresh_token: refreshToken });
        if (refreshed.data.session) {
          setSessionCookies(res, refreshed.data.session.access_token, refreshed.data.session.refresh_token);
          return { id: refreshed.data.session.user.id, email: refreshed.data.session.user.email };
        }
      } catch {
        return null;
      }
    }
    return null;
  }

  let { data, error } = await supabase.auth.getUser(accessToken);

  if ((error || !data.user) && refreshToken) {
    try {
      const refreshed = await supabase.auth.refreshSession({ refresh_token: refreshToken });
      if (refreshed.data.session) {
        data = { user: refreshed.data.session.user };
        error = null;
        setSessionCookies(res, refreshed.data.session.access_token, refreshed.data.session.refresh_token);
      }
    } catch {
      // Continue to check if user was resolved
    }
  }

  if (error || !data.user) return null;

  return { id: data.user.id, email: data.user.email };
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const accessToken = req.cookies?.[SESSION_COOKIE] as string | undefined;

    // Check fast dual-tier session cache (30s TTL)
    if (accessToken) {
      const cached = await appCache.get<{ user: { id: string; email?: string }; profile: any }>(`auth_session:${accessToken}`);
      if (cached) {
        req.user = cached.user;
        req.profile = cached.profile;
        return next();
      }
    }

    const user = await loadUser(req, res);
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Authentication required' });
    }

    const supabase = createAdminClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, role, full_name')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      clearSessionCookies(res);
      return res.status(401).json({ ok: false, error: 'Account not found or has been deleted.' });
    }

    // Cache verified session for 30 seconds
    if (accessToken) {
      await appCache.set(`auth_session:${accessToken}`, { user, profile }, 30, ['auth_sessions']);
    }

    req.user = user;
    req.profile = profile;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ ok: false, error: 'Authentication failed' });
  }
}

export async function getOptionalSession(req: AuthedRequest, res: Response) {
  const accessToken = req.cookies?.[SESSION_COOKIE] as string | undefined;

  if (accessToken) {
    const cached = await appCache.get<{ user: { id: string; email?: string }; profile: any }>(`auth_session:${accessToken}`);
    if (cached) {
      return cached;
    }
  }

  const user = await loadUser(req, res);
  if (!user) return { user: null, profile: null };

  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, role, full_name')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    clearSessionCookies(res);
    return { user: null, profile: null };
  }

  if (accessToken) {
    await appCache.set(`auth_session:${accessToken}`, { user, profile }, 30, ['auth_sessions']);
  }

  return {
    user,
    profile,
  };
}

export function requireRole(...roles: string[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ ok: false, error: 'Authentication required' });
    }
    const role = req.profile?.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ ok: false, error: 'Forbidden: insufficient permissions' });
    }
    next();
  };
}
