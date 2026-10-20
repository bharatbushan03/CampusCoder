import crypto from 'crypto';
import { createAdminClient } from '../utils/supabase/admin';
import { getRedisClient, isRedisReady } from './redis';

export interface StoredOtpRecord {
  email: string;
  otpCode: string;
  purpose: string;
  payload?: any;
  expiresAt: number; // timestamp in ms
  createdAt: number; // timestamp in ms
  attempts: number;  // failed verification attempts
}

// In-memory fallback map: key = `${purpose}:${email}`
const memoryOtpMap = new Map<string, StoredOtpRecord>();
const memoryCooldownMap = new Map<string, number>();

const OTP_TTL_SECONDS = 10 * 60; // 10 minutes
const OTP_TTL_MS = OTP_TTL_SECONDS * 1000;
const RESEND_COOLDOWN_SECONDS = 60; // 60 seconds
const RESEND_COOLDOWN_MS = RESEND_COOLDOWN_SECONDS * 1000;
const OTP_MAX_ATTEMPTS = 5; // Lock out after 5 failed attempts

export function generateOtpCode(): string {
  // 6-digit cryptographically secure numeric OTP
  return crypto.randomInt(100000, 1000000).toString();
}

function getCacheKey(email: string, purpose: string): string {
  return `cc:otp:${purpose.toLowerCase()}:${email.trim().toLowerCase()}`;
}

function getCooldownKey(email: string, purpose: string): string {
  return `cc:otp:cooldown:${purpose.toLowerCase()}:${email.trim().toLowerCase()}`;
}

export function checkResendCooldown(email: string, purpose: string): { allowed: boolean; waitSeconds: number } {
  const key = getCacheKey(email, purpose);
  const createdAt = memoryCooldownMap.get(key) || memoryOtpMap.get(key)?.createdAt;

  if (createdAt) {
    const elapsed = Date.now() - createdAt;
    if (elapsed < RESEND_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
      return { allowed: false, waitSeconds };
    }
  }

  return { allowed: true, waitSeconds: 0 };
}

export async function getExistingPayload(email: string, purpose: string = 'signup'): Promise<any> {
  const normalizedEmail = email.trim().toLowerCase();
  const redisKey = getCacheKey(normalizedEmail, purpose);

  // 1. Check Redis
  const redis = getRedisClient();
  if (redis && isRedisReady()) {
    try {
      const raw = await redis.get(redisKey);
      if (raw) {
        const record = JSON.parse(raw) as StoredOtpRecord;
        if (record?.payload) {
          return record.payload;
        }
      }
    } catch (err) {
      console.warn('[OtpStore] Redis payload fetch error:', err);
    }
  }

  // 2. Check in-memory map
  const memoryRecord = memoryOtpMap.get(redisKey);
  if (memoryRecord?.payload) {
    return memoryRecord.payload;
  }

  // 3. Check Supabase DB
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('email_otps' as any)
      .select('payload')
      .eq('email', normalizedEmail)
      .eq('purpose', purpose)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return (data as any)?.payload || null;
  } catch {
    return null;
  }
}

export async function clearExistingOtp(email: string, purpose: string = 'signup'): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const key = getCacheKey(normalizedEmail, purpose);

  // 1. Delete from Redis
  const redis = getRedisClient();
  if (redis && isRedisReady()) {
    try {
      await redis.del(key);
    } catch (err) {
      console.warn('[OtpStore] Redis delete error:', err);
    }
  }

  // 2. Delete from in-memory cache
  memoryOtpMap.delete(key);

  // 3. Delete from database
  try {
    const supabase = createAdminClient();
    await supabase
      .from('email_otps' as any)
      .delete()
      .eq('email', normalizedEmail)
      .eq('purpose', purpose);
  } catch {
    // ignore
  }
}

export async function storeOtp(
  email: string,
  otpCode: string,
  purpose: string = 'signup',
  payload?: any
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const key = getCacheKey(normalizedEmail, purpose);
  const now = Date.now();
  const expiresAt = now + OTP_TTL_MS;

  // Preserve previous payload if not explicitly passed
  let finalPayload = payload;
  if (!finalPayload) {
    finalPayload = await getExistingPayload(normalizedEmail, purpose);
  }

  const record: StoredOtpRecord = {
    email: normalizedEmail,
    otpCode: otpCode.trim(),
    purpose,
    payload: finalPayload,
    expiresAt,
    createdAt: now,
    attempts: 0,
  };

  // 1. Store in Redis with TTL
  const redis = getRedisClient();
  if (redis && isRedisReady()) {
    try {
      await redis.set(key, JSON.stringify(record), 'EX', OTP_TTL_SECONDS);
      await redis.set(getCooldownKey(normalizedEmail, purpose), '1', 'EX', RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      console.warn('[OtpStore] Redis save error:', err);
    }
  }

  // 2. Set new OTP record in local memory
  memoryOtpMap.set(key, record);
  memoryCooldownMap.set(key, now);

  // 3. Persist to Supabase DB as backup
  try {
    const supabase = createAdminClient();
    await supabase
      .from('email_otps' as any)
      .delete()
      .eq('email', normalizedEmail)
      .eq('purpose', purpose);

    await supabase.from('email_otps' as any).insert({
      email: normalizedEmail,
      otp_code: otpCode.trim(),
      purpose,
      payload: finalPayload || null,
      expires_at: new Date(expiresAt).toISOString(),
    });
  } catch (dbErr) {
    console.warn('[OtpStore] Notice: Persistent DB save skipped, using cache:', dbErr);
  }
}

export async function verifyAndConsumeOtp(
  email: string,
  otpCode: string,
  purpose: string = 'signup'
): Promise<{ ok: boolean; payload?: any; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const cleanOtp = otpCode.trim();
  const key = getCacheKey(normalizedEmail, purpose);
  const now = Date.now();

  // 1. Check Redis first
  const redis = getRedisClient();
  if (redis && isRedisReady()) {
    try {
      const raw = await redis.get(key);
      if (raw) {
        const record = JSON.parse(raw) as StoredOtpRecord;

        // Enforce brute-force lockout
        if ((record.attempts || 0) >= OTP_MAX_ATTEMPTS) {
          await clearExistingOtp(normalizedEmail, purpose);
          return { ok: false, error: 'Too many failed attempts. This code has been invalidated. Please request a new one.' };
        }

        if (record.otpCode === cleanOtp) {
          // Success: consume and delete OTP from Redis & Memory & DB
          await clearExistingOtp(normalizedEmail, purpose);
          return { ok: true, payload: record.payload };
        } else {
          // Increment failed attempt counter
          record.attempts = (record.attempts || 0) + 1;
          const remainingTtl = Math.max(1, Math.ceil((record.expiresAt - now) / 1000));
          await redis.set(key, JSON.stringify(record), 'EX', remainingTtl);
          // Also update memory
          const memRecord = memoryOtpMap.get(key);
          if (memRecord) memRecord.attempts = record.attempts;
          const attemptsLeft = OTP_MAX_ATTEMPTS - record.attempts;
          if (attemptsLeft <= 0) {
            await clearExistingOtp(normalizedEmail, purpose);
            return { ok: false, error: 'Too many failed attempts. This code has been invalidated. Please request a new one.' };
          }
          return { ok: false, error: `Invalid verification code. ${attemptsLeft} attempt(s) remaining.` };
        }
      }
    } catch (err) {
      console.warn('[OtpStore] Redis verify error:', err);
    }
  }

  // 2. Check in-memory cache
  const memoryRecord = memoryOtpMap.get(key);
  if (memoryRecord) {
    if (now > memoryRecord.expiresAt) {
      await clearExistingOtp(normalizedEmail, purpose);
      return { ok: false, error: 'Verification code has expired. Please request a new one.' };
    }

    // Enforce brute-force lockout
    if ((memoryRecord.attempts || 0) >= OTP_MAX_ATTEMPTS) {
      await clearExistingOtp(normalizedEmail, purpose);
      return { ok: false, error: 'Too many failed attempts. This code has been invalidated. Please request a new one.' };
    }

    if (memoryRecord.otpCode !== cleanOtp) {
      memoryRecord.attempts = (memoryRecord.attempts || 0) + 1;
      const attemptsLeft = OTP_MAX_ATTEMPTS - memoryRecord.attempts;
      if (attemptsLeft <= 0) {
        await clearExistingOtp(normalizedEmail, purpose);
        return { ok: false, error: 'Too many failed attempts. This code has been invalidated. Please request a new one.' };
      }
      return { ok: false, error: `Invalid verification code. ${attemptsLeft} attempt(s) remaining.` };
    }

    // Success: consume and delete OTP
    await clearExistingOtp(normalizedEmail, purpose);
    return { ok: true, payload: memoryRecord.payload };
  }

  // 3. Fallback to DB check
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('email_otps' as any)
      .select('*')
      .eq('email', normalizedEmail)
      .eq('purpose', purpose)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return { ok: false, error: 'No active verification code found. Please request a new code.' };
    }

    const expiresAt = new Date((data as any).expires_at).getTime();
    if (now > expiresAt) {
      await supabase.from('email_otps' as any).delete().eq('id', (data as any).id);
      return { ok: false, error: 'Verification code has expired. Please request a new one.' };
    }

    if ((data as any).otp_code !== cleanOtp) {
      return { ok: false, error: 'Invalid verification code. Please check and try again.' };
    }

    // Delete verified OTP
    await supabase.from('email_otps' as any).delete().eq('id', (data as any).id);

    return { ok: true, payload: (data as any).payload };
  } catch (err: any) {
    console.error('[OtpStore] DB verify error:', err);
    return { ok: false, error: 'Failed to verify code. Please try again.' };
  }
}
