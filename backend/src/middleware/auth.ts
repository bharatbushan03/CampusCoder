import type { NextFunction, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';
import { getSupabasePublicKey, getSupabaseUrl } from '../utils/supabase/config';
import { REFRESH_COOKIE, SESSION_COOKIE, setSessionCookies } from '../lib/session';

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

export function createAnonClient() {
  return createClient<Database>(getSupabaseUrl(), getSupabasePublicKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
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

  if (!accessToken) return null;

  let { data, error } = await supabase.auth.getUser(accessToken);

  if ((error || !data.user) && refreshToken) {
    const refreshed = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (refreshed.data.session) {
      data = { user: refreshed.data.session.user };
      error = null;
      setSessionCookies(res, refreshed.data.session.access_token, refreshed.data.session.refresh_token);
    }
  }

  if (error || !data.user) return null;

  return { id: data.user.id, email: data.user.email };
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const user = await loadUser(req, res);
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Authentication required' });
    }

    const supabase = createAnonClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, role, full_name')
      .eq('id', user.id)
      .single();

    req.user = user;
    req.profile = profile;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ ok: false, error: 'Authentication failed' });
  }
}

export async function getOptionalSession(req: AuthedRequest, res: Response) {
  const user = await loadUser(req, res);
  if (!user) return { user: null, profile: null };

  const supabase = createAnonClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, role, full_name')
    .eq('id', user.id)
    .single();

  return { user, profile };
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
