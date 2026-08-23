import crypto from 'crypto';
import { createAdminClient } from '../utils/supabase/admin';

export interface StoredOtpRecord {
  email: string;
  otpCode: string;
  purpose: string;
  payload?: any;
  expiresAt: number; // timestamp in ms
  createdAt: number; // timestamp in ms
}

// In-memory fallback map: key = `${purpose}:${email}`
const memoryOtpMap = new Map<string, StoredOtpRecord>();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

export function generateOtpCode(): string {
  // 6-digit cryptographically secure numeric OTP
  return crypto.randomInt(100000, 1000000).toString();
}

function getCacheKey(email: string, purpose: string): string {
  return `${purpose.toLowerCase()}:${email.trim().toLowerCase()}`;
}

export function checkResendCooldown(email: string, purpose: string): { allowed: boolean; waitSeconds: number } {
  const key = getCacheKey(email, purpose);
  const existing = memoryOtpMap.get(key);

  if (existing) {
    const elapsed = Date.now() - existing.createdAt;
    if (elapsed < RESEND_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
      return { allowed: false, waitSeconds };
    }
  }

  return { allowed: true, waitSeconds: 0 };
}

export async function getExistingPayload(email: string, purpose: string = 'signup'): Promise<any> {
  const normalizedEmail = email.trim().toLowerCase();
  const key = getCacheKey(normalizedEmail, purpose);

  // 1. Check in-memory map
  const memoryRecord = memoryOtpMap.get(key);
  if (memoryRecord?.payload) {
    return memoryRecord.payload;
  }

  // 2. Check Supabase DB
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

  // Delete from in-memory cache
  memoryOtpMap.delete(key);

  // Delete from database
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

  // 1. Remove any old OTP record immediately from memory cache
  memoryOtpMap.delete(key);

  // 2. Set new OTP record in memory
  const record: StoredOtpRecord = {
    email: normalizedEmail,
    otpCode: otpCode.trim(),
    purpose,
    payload: finalPayload,
    expiresAt,
    createdAt: now,
  };
  memoryOtpMap.set(key, record);

  // 3. Invalidate and clear all prior OTPs from Supabase and insert only the new one
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
    console.warn('[OtpStore] Notice: Persistent DB save skipped, using memory cache:', dbErr);
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

  // 1. Check in-memory cache first
  const memoryRecord = memoryOtpMap.get(key);
  if (memoryRecord) {
    if (now > memoryRecord.expiresAt) {
      memoryOtpMap.delete(key);
      return { ok: false, error: 'Verification code has expired. Please request a new one.' };
    }

    if (memoryRecord.otpCode !== cleanOtp) {
      return { ok: false, error: 'Invalid verification code. Please check and try again.' };
    }

    // Success: consume and delete OTP
    memoryOtpMap.delete(key);

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

    return { ok: true, payload: memoryRecord.payload };
  }

  // 2. Fallback to DB check
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
