'use server';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { registrationSchema } from '@/lib/validation';
import { sendRegistrationEmails } from '@/lib/registrationEmails';
import { z } from 'zod';
import { createHash } from 'crypto';

/**
 * Simple sanitization to prevent basic XSS/injection
 * In a production app, use a library like DOMPurify or sanitize-html
 */
function sanitizeText(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

type RegistrationPayload = z.infer<typeof registrationSchema>;
const eventIdSchema = z.uuid('Invalid event identifier.');

export async function registerForEvent(payload: RegistrationPayload, eventId: string) {
  const supabase = await createClient();

  const eventIdValidation = eventIdSchema.safeParse(eventId);
  if (!eventIdValidation.success) {
    throw new Error(eventIdValidation.error.issues[0].message);
  }

  // 1. Server-side Validation
  const validation = registrationSchema.safeParse(payload);
  if (!validation.success) {
    throw new Error(validation.error.issues[0].message);
  }

  const data = validation.data;
  const email = data.email.toLowerCase().trim();

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, title, date, start_time, end_time, mode, registration_deadline, status')
    .eq('id', eventId)
    .single();

  if (eventError || !event) {
    throw new Error('This event is not available for public registration.');
  }

  if (event.status !== 'published') {
    throw new Error('Registration is closed for this event.');
  }

  const now = new Date();
  const eventDate = new Date(`${event.date}T23:59:59`);
  if (event.registration_deadline && new Date(event.registration_deadline) < now) {
    throw new Error('The registration deadline has passed for this event.');
  }
  if (eventDate < now) {
    throw new Error('Registration is closed because this event date has passed.');
  }

  // 2. Server-side Rate Limiting
  if (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const adminSupabase = createAdminClient();
    const rateLimitKey = `registration:${createHash('sha256').update(email).digest('hex')}`;
    const { data: rateLimit } = await adminSupabase
      .from('rate_limits')
      .select('last_attempt')
      .eq('key', rateLimitKey)
      .maybeSingle();

    if (rateLimit) {
      const lastAttempt = new Date(rateLimit.last_attempt).getTime();
      if (Date.now() - lastAttempt < 60000) {
        throw new Error('Too many requests. Please wait a minute before registering again.');
      }
    }

    await adminSupabase
      .from('rate_limits')
      .upsert({ key: rateLimitKey, last_attempt: new Date().toISOString() });
  }

  // 3. Sanitization
  const sanitizedData = {
    full_name: sanitizeText(data.fullName.trim()),
    email: email,
    phone: data.phone.trim(),
    college: sanitizeText(data.college.trim()),
    branch: sanitizeText(data.branch.trim()),
    year: data.year,
    coding_level: data.codingLevel,
    preferred_language: data.preferredLanguage,
    reason_to_join: data.reasonToJoin ? sanitizeText(data.reasonToJoin.trim()) : null,
    event_id: eventId,
    attendance_status: 'registered' as const,
  };

  // 3. Duplicate Registration Prevention
  const { data: duplicateCheck } = await supabase
    .from('registrations')
    .select('id')
    .eq('event_id', eventId)
    .eq('email', sanitizedData.email)
    .limit(1);

  if (duplicateCheck && duplicateCheck.length > 0) {
    throw new Error('This email is already registered for this event.');
  }

  // 4. Insert Registration
  const { error: insertError } = await supabase
    .from('registrations')
    .insert(sanitizedData);

  if (insertError) {
    if (insertError.code === '23505') {
      throw new Error('Duplicate registration detected.');
    }
    console.error('Database insertion error:', insertError);
    throw new Error('A system error occurred during registration. Please try again.');
  }

  // 5. Async Emails (Non-blocking)
  try {
    await sendRegistrationEmails(
      {
        full_name: sanitizedData.full_name,
        email: sanitizedData.email,
        college: sanitizedData.college,
        branch: sanitizedData.branch
      },
      event
    );
  } catch (emailErr) {
    console.error('Non-critical: Email failed to send', emailErr);
  }

  return { success: true };
}
