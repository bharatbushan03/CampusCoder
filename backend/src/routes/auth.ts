import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { createAnonClient, getOptionalSession, requireAuth, type AuthedRequest } from '../middleware/auth';
import { createAdminClient } from '../utils/supabase/admin';
import { clearSessionCookies, REFRESH_COOKIE, setSessionCookies } from '../lib/session';

const router = Router();

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .transform((val) => val.trim().toLowerCase())
    .pipe(z.string().email('Invalid email address')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .transform((val) => val.trim().toLowerCase())
    .pipe(z.string().email('Invalid email address')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Name is required'),
  college: z.string().min(2, 'College name is required'),
  branch: z.string().min(2, 'Branch is required'),
  year: z.string().min(1, 'Year is required'),
});

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .transform((val) => val.trim().toLowerCase())
    .pipe(z.string().email('Invalid email address')),
});

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  accessToken: z.string().min(1, 'Recovery token missing'),
});

async function loadProfile(userId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, email, role, full_name, college, branch, year, created_at')
    .eq('id', userId)
    .single();
  return data;
}

router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.issues[0].message });
  }

  try {
    const supabase = createAnonClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error || !data.session) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password' });
    }

    setSessionCookies(res, data.session.access_token, data.session.refresh_token);

    const profile = await loadProfile(data.user.id);

    return res.json({
      ok: true,
      user: { id: data.user.id, email: data.user.email },
      profile: profile || {
        id: data.user.id,
        email: data.user.email,
        role: 'student',
        full_name: null,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ ok: false, error: 'Login failed' });
  }
});

router.post('/signup', async (req: Request, res: Response) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.issues[0].message });
  }

  try {
    const supabase = createAnonClient();
    const { email, password, fullName, college, branch, year } = parsed.data;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          college,
          branch,
          year,
          role: 'student',
        },
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes('already')) {
        return res.status(409).json({ ok: false, error: 'An account with this email already exists' });
      }
      return res.status(400).json({ ok: false, error: error.message });
    }

    if (!data.user) {
      return res.status(400).json({ ok: false, error: 'Signup failed' });
    }

    if (data.session) {
      setSessionCookies(res, data.session.access_token, data.session.refresh_token);
    }

    return res.json({
      ok: true,
      user: { id: data.user.id, email: data.user.email },
      requiresEmailConfirmation: !data.session,
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    return res.status(500).json({ ok: false, error: 'Signup failed' });
  }
});

router.post('/logout', (_req: Request, res: Response) => {
  clearSessionCookies(res);
  return res.json({ ok: true });
});

router.get('/me', async (req: AuthedRequest, res: Response) => {
  try {
    const { user, profile } = await getOptionalSession(req, res);
    return res.json({ ok: true, user, profile });
  } catch (err) {
    console.error('Me route error:', err);
    return res.status(500).json({ ok: false, error: 'Authentication failed' });
  }
});

router.get('/elevate-enabled', (_req: Request, res: Response) => {
  return res.json({ ok: true, enabled: process.env.ALLOW_SELF_ELEVATE === '1' });
});

// Demo / dev convenience — only available when ALLOW_SELF_ELEVATE=1 is set
// in the backend env. Promotes the currently signed-in user to role=organizer
// so they can reach the admin console. Production deployments should leave
// the flag unset (or set to 0), which returns 403 here.
router.post('/elevate-me', async (req: AuthedRequest, res: Response) => {
  if (process.env.ALLOW_SELF_ELEVATE !== '1') {
    return res.status(403).json({
      ok: false,
      error: 'Self-elevation is disabled. Ask a database admin to set role=admin on your profile.',
    });
  }

  const { user } = await getOptionalSession(req, res);
  if (!user) {
    return res.status(401).json({ ok: false, error: 'Sign in first.' });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'organizer' })
    .eq('id', user.id)
    .select('id, email, role, full_name')
    .single();

  if (error || !data) {
    return res.status(500).json({ ok: false, error: 'Failed to elevate role.' });
  }

  return res.json({ ok: true, profile: data });
});

router.post('/forgot-password', async (req: Request, res: Response) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.issues[0].message });
  }

  try {
    const supabase = createAnonClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${siteUrl}/reset-password`,
    });

    if (error) {
      return res.status(400).json({ ok: false, error: error.message });
    }

    return res.json({ ok: true });
  } catch (err: any) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ ok: false, error: 'Failed to send reset email' });
  }
});

router.post('/reset-password', async (req: Request, res: Response) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.issues[0].message });
  }

  try {
    const anon = createAnonClient();
    const { data: userData, error: userError } = await anon.auth.getUser(parsed.data.accessToken);

    if (userError || !userData.user) {
      return res.status(401).json({ ok: false, error: 'Invalid or expired recovery link' });
    }

    const admin = createAdminClient();
    const { error: updateError } = await admin.auth.admin.updateUserById(userData.user.id, {
      password: parsed.data.password,
    });

    if (updateError) {
      return res.status(400).json({ ok: false, error: updateError.message });
    }

    clearSessionCookies(res);
    return res.json({ ok: true });
  } catch (err: any) {
    console.error('Reset password error:', err);
    return res.status(500).json({ ok: false, error: 'Failed to reset password' });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (!refreshToken) {
    return res.status(401).json({ ok: false, error: 'No refresh token' });
  }

  try {
    const supabase = createAnonClient();
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

    if (error || !data.session) {
      return res.status(401).json({ ok: false, error: 'Session expired' });
    }

    setSessionCookies(res, data.session.access_token, data.session.refresh_token);
    return res.json({ ok: true });
  } catch (err: any) {
    console.error('Refresh error:', err);
    return res.status(500).json({ ok: false, error: 'Refresh failed' });
  }
});

export { router as authRouter };
