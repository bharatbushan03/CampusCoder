import React from 'react';
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { createAnonClient, getOptionalSession, invalidateAuthSession, requireAuth, type AuthedRequest } from '../middleware/auth';
import { createAdminClient } from '../utils/supabase/admin';
import { clearSessionCookies, REFRESH_COOKIE, SESSION_COOKIE, setSessionCookies } from '../lib/session';
import { generateOtpCode, storeOtp, verifyAndConsumeOtp, checkResendCooldown, getExistingPayload } from '../lib/otpStore';
import { sendAppEmail } from '../lib/email';
import { OtpVerificationEmail } from '../components/emails/OtpVerificationEmail';
import { PasswordResetEmail } from '../components/emails/PasswordResetEmail';
import { authRateLimiter } from '../middleware/rateLimit';

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

const signupVerifyOtpSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .transform((val) => val.trim().toLowerCase())
    .pipe(z.string().email('Invalid email address')),
  otp: z.string().min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits'),
});

const resendOtpSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .transform((val) => val.trim().toLowerCase())
    .pipe(z.string().email('Invalid email address')),
  purpose: z.string().default('signup'),
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
  accessToken: z.string().optional(),
  email: z
    .string()
    .transform((val) => val.trim().toLowerCase())
    .pipe(z.string().email('Invalid email address'))
    .optional(),
  otp: z.string().min(6).max(6).optional(),
});

async function loadProfile(userId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, email, role, full_name, college, branch, year, created_at')
    .eq('id', userId)
    .maybeSingle();
  return data;
}

async function cleanupOrphanAuthUser(email: string): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const normalizedEmail = email.trim().toLowerCase();

    // Check if an active profile exists
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    // If profile exists, it is a valid active account - do NOT delete
    if (profile) return false;

    // Search for orphan user in auth.users whose profile was deleted
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (!error && data?.users) {
      const orphan = data.users.find((u) => u.email?.toLowerCase() === normalizedEmail);
      if (orphan) {
        console.log(`[Auth] Cleaning up orphan auth.users record for ${normalizedEmail} (id: ${orphan.id})`);
        await admin.auth.admin.deleteUser(orphan.id);
        return true;
      }
    }
    return false;
  } catch (err) {
    console.warn('[Auth] Orphan cleanup notice:', err);
    return false;
  }
}

router.post('/login', authRateLimiter, async (req: Request, res: Response) => {
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

    const profile = await loadProfile(data.user.id);
    if (!profile) {
      clearSessionCookies(res);
      return res.status(401).json({ ok: false, error: 'Account not found or has been removed.' });
    }

    setSessionCookies(res, data.session.access_token, data.session.refresh_token);

    return res.json({
      ok: true,
      user: { id: data.user.id, email: data.user.email },
      profile,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ ok: false, error: 'Login failed' });
  }
});

// Step 1: Send OTP to user's email for registration verification
router.post('/signup/send-otp', authRateLimiter, async (req: Request, res: Response) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.issues[0].message });
  }

  try {
    const { email, password, fullName, college, branch, year } = parsed.data;
    const admin = createAdminClient();

    // Check if active profile already exists
    const { data: existingUser } = await admin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return res.status(409).json({ ok: false, error: 'An account with this email already exists. Please sign in instead.' });
    }

    // Check resend rate limit cooldown (60 seconds)
    const cooldown = checkResendCooldown(email, 'signup');
    if (!cooldown.allowed) {
      return res.status(429).json({
        ok: false,
        error: `Please wait ${cooldown.waitSeconds} seconds before requesting a new OTP.`,
        waitSeconds: cooldown.waitSeconds,
      });
    }

    // Generate 6-digit OTP
    const otp = generateOtpCode();

    // Store OTP and pending registration payload
    await storeOtp(email, otp, 'signup', {
      email,
      password,
      fullName,
      college,
      branch,
      year,
    });

    // Send OTP email using Azure/Resend
    const emailResult = await sendAppEmail({
      to: email,
      subject: `Your CampusCoder Verification Code: ${otp}`,
      react: React.createElement(OtpVerificationEmail, {
        fullName,
        otpCode: otp,
        expiresInMinutes: 10,
      }),
      plainText: `Hi ${fullName}, your CampusCoder verification code is ${otp}. This code is valid for 10 minutes.`,
    });

    if (!emailResult.success) {
      console.warn('[Signup Send OTP] Email sending warning:', emailResult.error);
    }

    return res.json({
      ok: true,
      message: 'Verification code sent to your email',
      email,
    });
  } catch (err: any) {
    console.error('Send OTP error:', err);
    return res.status(500).json({ ok: false, error: 'Failed to send verification code. Please try again.' });
  }
});

// Step 2: Verify OTP and finalize user creation with 48-hour session
router.post('/signup/verify-otp', authRateLimiter, async (req: Request, res: Response) => {
  const parsed = signupVerifyOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.issues[0].message });
  }

  try {
    const { email, otp } = parsed.data;

    // Verify OTP
    const verification = await verifyAndConsumeOtp(email, otp, 'signup');
    if (!verification.ok || !verification.payload) {
      return res.status(400).json({
        ok: false,
        error: verification.error || 'Invalid or expired verification code. Please request a new one.',
      });
    }

    const { password, fullName, college, branch, year } = verification.payload;
    const admin = createAdminClient();

    // Create confirmed user in Supabase Auth via Admin Client (bypasses Supabase SMTP rate limits)
    let { data: createdUser, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        college,
        branch,
        year,
        role: 'student',
      },
    });

    // If already exists in auth.users, check if it's an orphan and retry
    if (createError && (createError.message.toLowerCase().includes('already') || createError.message.toLowerCase().includes('unique'))) {
      const cleaned = await cleanupOrphanAuthUser(email);
      if (cleaned) {
        const retryResult = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            college,
            branch,
            year,
            role: 'student',
          },
        });
        createdUser = retryResult.data;
        createError = retryResult.error;
      }
    }

    if (createError) {
      if (createError.message.toLowerCase().includes('already') || createError.message.toLowerCase().includes('unique')) {
        return res.status(409).json({ ok: false, error: 'An account with this email already exists' });
      }
      return res.status(400).json({ ok: false, error: createError.message });
    }

    if (!createdUser?.user) {
      return res.status(400).json({ ok: false, error: 'Failed to create user account' });
    }

    // Authenticate and issue 48-hour session cookies
    const anon = createAnonClient();
    const { data: sessionData } = await anon.auth.signInWithPassword({
      email,
      password,
    });

    if (sessionData?.session) {
      setSessionCookies(res, sessionData.session.access_token, sessionData.session.refresh_token);
    }

    const profile = await loadProfile(createdUser.user.id);

    return res.json({
      ok: true,
      user: { id: createdUser.user.id, email: createdUser.user.email },
      profile: profile || {
        id: createdUser.user.id,
        email: createdUser.user.email,
        role: 'student',
        full_name: fullName,
      },
    });
  } catch (err: any) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({ ok: false, error: 'Failed to complete registration' });
  }
});

// Resend OTP endpoint
router.post('/resend-otp', authRateLimiter, async (req: Request, res: Response) => {
  const parsed = resendOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.issues[0].message });
  }

  try {
    const { email, purpose } = parsed.data;

    // Check resend cooldown
    const cooldown = checkResendCooldown(email, purpose);
    if (!cooldown.allowed) {
      return res.status(429).json({
        ok: false,
        error: `Please wait ${cooldown.waitSeconds} seconds before requesting another code.`,
        waitSeconds: cooldown.waitSeconds,
      });
    }

    // Retrieve previous registration details
    const existingPayload = await getExistingPayload(email, purpose);

    // Generate new OTP
    const otp = generateOtpCode();

    // Store new OTP (this automatically deletes any old OTP from memory and Supabase DB)
    await storeOtp(email, otp, purpose, existingPayload);

    // Send email with new OTP
    const fullName = existingPayload?.fullName || '';
    await sendAppEmail({
      to: email,
      subject: `Your CampusCoder Verification Code: ${otp}`,
      react: React.createElement(OtpVerificationEmail, {
        fullName,
        otpCode: otp,
        expiresInMinutes: 10,
      }),
      plainText: `Hi ${fullName || 'there'}, your new CampusCoder verification code is ${otp}. This code is valid for 10 minutes. The previous code has been invalidated.`,
    });

    return res.json({
      ok: true,
      message: 'A new verification code has been sent to your email. The old code is now invalid.',
      email,
    });
  } catch (err: any) {
    console.error('Resend OTP error:', err);
    return res.status(500).json({ ok: false, error: 'Failed to resend verification code' });
  }
});

// Fallback direct signup (auto-confirmed via admin client)
router.post('/signup', authRateLimiter, async (req: Request, res: Response) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.issues[0].message });
  }

  try {
    const { email, password, fullName, college, branch, year } = parsed.data;
    const admin = createAdminClient();

    // Check if active profile exists
    const { data: existingUser } = await admin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return res.status(409).json({ ok: false, error: 'An account with this email already exists' });
    }

    let { data: createdUser, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        college,
        branch,
        year,
        role: 'student',
      },
    });

    if (createError && (createError.message.toLowerCase().includes('already') || createError.message.toLowerCase().includes('unique'))) {
      const cleaned = await cleanupOrphanAuthUser(email);
      if (cleaned) {
        const retryResult = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            college,
            branch,
            year,
            role: 'student',
          },
        });
        createdUser = retryResult.data;
        createError = retryResult.error;
      }
    }

    if (createError) {
      if (createError.message.toLowerCase().includes('already') || createError.message.toLowerCase().includes('unique')) {
        return res.status(409).json({ ok: false, error: 'An account with this email already exists' });
      }
      return res.status(400).json({ ok: false, error: createError.message });
    }

    if (!createdUser?.user) {
      return res.status(400).json({ ok: false, error: 'Signup failed' });
    }

    const anon = createAnonClient();
    const { data: sessionData } = await anon.auth.signInWithPassword({
      email,
      password,
    });

    if (sessionData?.session) {
      setSessionCookies(res, sessionData.session.access_token, sessionData.session.refresh_token);
    }

    const profile = await loadProfile(createdUser.user.id);

    return res.json({
      ok: true,
      user: { id: createdUser.user.id, email: createdUser.user.email },
      profile: profile || {
        id: createdUser.user.id,
        email: createdUser.user.email,
        role: 'student',
        full_name: fullName,
      },
      requiresEmailConfirmation: false,
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    return res.status(500).json({ ok: false, error: 'Signup failed' });
  }
});

router.post('/logout', (req: Request, res: Response) => {
  const accessToken = req.cookies?.[SESSION_COOKIE] as string | undefined;
  if (accessToken) {
    invalidateAuthSession(accessToken);
  }
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

router.post('/forgot-password', authRateLimiter, async (req: Request, res: Response) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.issues[0].message });
  }

  try {
    const { email } = parsed.data;
    const admin = createAdminClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // 1. Strict database check: Verify account exists in public.profiles
    const { data: profile } = await admin
      .from('profiles')
      .select('id, full_name, email')
      .ilike('email', email)
      .maybeSingle();

    if (!profile) {
      return res.status(404).json({
        ok: false,
        error: 'No account found with this email address. Please check your spelling or sign up for a new account.',
      });
    }

    const userId = profile.id;
    const fullName = profile.full_name || '';

    // 2. Generate 6-digit OTP code & store with 10-minute expiry
    const otp = generateOtpCode();
    await storeOtp(email, otp, 'password_reset', { userId, email, fullName });

    // 3. Also generate recovery link if possible
    let actionLink = '';
    try {
      const { data: linkData } = await admin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
          redirectTo: `${siteUrl}/reset-password`,
        },
      });
      if (linkData?.properties?.action_link) {
        actionLink = linkData.properties.action_link;
      }
    } catch (linkErr) {
      console.warn('[Forgot Password] Generate recovery link note:', linkErr);
    }

    const resetDirectUrl = `${siteUrl}/reset-password?email=${encodeURIComponent(email)}`;

    // 4. Dispatch branded email via Azure/Resend
    const emailResult = await sendAppEmail({
      to: email,
      subject: `Your CampusCoder Password Reset Code: ${otp}`,
      react: React.createElement(PasswordResetEmail, {
        fullName,
        otpCode: otp,
        resetLink: actionLink || resetDirectUrl,
      }),
      plainText: `Hi ${fullName || 'there'}, your CampusCoder password reset code is: ${otp}\n\nReset your password at: ${resetDirectUrl}\n\nThis code is valid for 10 minutes.`,
    });

    if (!emailResult.success) {
      console.error('[Forgot Password] Azure/Resend send failed:', emailResult.error);
      return res.status(500).json({
        ok: false,
        error: `Failed to deliver email: ${emailResult.error?.message || 'Email delivery failed'}`,
      });
    }

    return res.json({
      ok: true,
      message: 'Password reset code sent to your email.',
      email,
    });
  } catch (err: any) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ ok: false, error: err.message || 'Failed to send reset email' });
  }
});

router.post('/reset-password', authRateLimiter, async (req: Request, res: Response) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.issues[0].message });
  }

  const { password, accessToken, email, otp } = parsed.data;
  const admin = createAdminClient();

  try {
    let targetUserId: string | null = null;

    if (otp && email) {
      // 1. Verify 6-digit OTP
      const verification = await verifyAndConsumeOtp(email, otp, 'password_reset');
      if (!verification.ok) {
        return res.status(400).json({ ok: false, error: verification.error || 'Invalid or expired OTP code' });
      }

      targetUserId = (verification.payload?.userId as string) || null;
      if (!targetUserId) {
        const { data: profile } = await admin
          .from('profiles')
          .select('id')
          .ilike('email', email)
          .maybeSingle();
        targetUserId = profile?.id || null;
      }
    } else if (accessToken) {
      // 2. Token-based recovery
      const anon = createAnonClient();
      const { data: userData, error: userError } = await anon.auth.getUser(accessToken);

      if (userError || !userData.user) {
        return res.status(401).json({ ok: false, error: 'Invalid or expired recovery link' });
      }
      targetUserId = userData.user.id;
    } else {
      return res.status(400).json({ ok: false, error: 'Either 6-digit OTP & email or recovery token is required' });
    }

    if (!targetUserId) {
      return res.status(400).json({ ok: false, error: 'User account not found' });
    }

    // Update password in Supabase Auth
    const { error: updateError } = await admin.auth.admin.updateUserById(targetUserId, {
      password,
    });

    if (updateError) {
      return res.status(400).json({ ok: false, error: updateError.message });
    }

    if (accessToken) {
      invalidateAuthSession(accessToken);
    } else {
      invalidateAuthSession();
    }
    clearSessionCookies(res);
    return res.json({ ok: true, message: 'Password has been successfully updated.' });
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
