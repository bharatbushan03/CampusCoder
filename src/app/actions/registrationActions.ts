'use server';

import { createClient } from '@/utils/supabase/server';
import { registrationSchema } from '@/lib/validation';
import { sendRegistrationEmails } from './emailActions';
import { z } from 'zod';

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

export async function registerForEvent(payload: any, eventId: string) {
  const supabase = await createClient();

  // 1. Server-side Validation
  const validation = registrationSchema.safeParse(payload);
  if (!validation.success) {
    throw new Error(validation.error.issues[0].message);
  }

  const data = validation.data;
  const email = data.email.toLowerCase().trim();

  // 2. Server-side Rate Limiting
  const rateLimitKey = `registration:${email}`;
  const { data: rateLimit } = await supabase
    .from('rate_limits')
    .select('last_attempt')
    .eq('key', rateLimitKey)
    .single();

  if (rateLimit) {
    const lastAttempt = new Date(rateLimit.last_attempt).getTime();
    const now = Date.now();
    if (now - lastAttempt < 60000) { // 1 minute throttle
      throw new Error('Too many requests. Please wait a minute before registering again.');
    }
  }

  // Update rate limit timestamp
  await supabase
    .from('rate_limits')
    .upsert({ key: rateLimitKey, last_attempt: new Date().toISOString() });

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
    attendance_status: 'registered',
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

  // 5. Fetch event details for email
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (!event) {
    throw new Error('Event not found.');
  }

  // 6. Async Emails (Non-blocking)
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
