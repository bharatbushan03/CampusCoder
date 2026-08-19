import { Router, type Request, type Response } from 'express';
import { createHash } from 'crypto';
import { z } from 'zod';
import { createAnonClient } from '../middleware/auth';
import { createAdminClient } from '../utils/supabase/admin';
import { registrationSchema } from '../lib/validation';
import { sendRegistrationEmails } from '../lib/registrationEmails';

const router = Router();

function sanitizeText(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

router.get('/', async (_req: Request, res: Response) => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .in('status', ['published', 'completed', 'cancelled'])
    .order('date', { ascending: true });

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to load events' });
  }
  return res.json({ ok: true, events: data });
});

router.get('/featured', async (_req: Request, res: Response) => {
  const supabase = createAnonClient();
  const today = new Date().toISOString().split('T')[0];

  const [featuredResult, pastResult] = await Promise.all([
    supabase
      .from('events')
      .select('*')
      .eq('status', 'published')
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(1),
    supabase
      .from('events')
      .select('*')
      .eq('status', 'completed')
      .order('date', { ascending: false })
      .limit(3),
  ]);

  if (featuredResult.error || pastResult.error) {
    return res.status(500).json({ ok: false, error: 'Failed to load events' });
  }
  return res.json({
    ok: true,
    featured: featuredResult.data,
    pastEvents: pastResult.data,
  });
});

router.get('/archive', async (_req: Request, res: Response) => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('events')
    .select('*, registrations (id)')
    .eq('status', 'completed')
    .order('date', { ascending: false });

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to load archive' });
  }
  return res.json({ ok: true, events: data });
});

router.get('/workshops', async (_req: Request, res: Response) => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('event_type', 'workshop')
    .in('status', ['published', 'completed'])
    .order('date', { ascending: false });

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to load workshops' });
  }
  return res.json({ ok: true, events: data });
});

router.get('/options', async (_req: Request, res: Response) => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('events')
    .select('id, title, date, start_time, end_time')
    .eq('status', 'published')
    .order('date', { ascending: true });

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to load events' });
  }
  return res.json({ ok: true, events: data });
});

router.get('/slug/:slug', async (req: Request, res: Response) => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('events')
    .select('*, event_owners (*)')
    .eq('slug', req.params.slug)
    .in('status', ['published', 'completed', 'cancelled'])
    .single();

  if (error || !data) {
    return res.status(404).json({ ok: false, error: 'Event not found' });
  }
  return res.json({ ok: true, event: data });
});

router.get('/slug/:slug/related', async (req: Request, res: Response) => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .neq('slug', req.params.slug)
    .limit(2);

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to load related events' });
  }
  return res.json({ ok: true, events: data });
});

router.get('/community-links', async (_req: Request, res: Response) => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('community_links')
    .select('*')
    .eq('is_active', true)
    .order('platform', { ascending: true });

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to load community links' });
  }
  return res.json({ ok: true, links: data });
});

router.get('/announcements/latest', async (_req: Request, res: Response) => {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from('announcements')
    .select('*, events(title, slug)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to load announcement' });
  }
  return res.json({ ok: true, announcement: data || null });
});

const eventIdSchema = z.uuid('Invalid event identifier.');

router.post('/registrations', async (req: Request, res: Response) => {
  const { eventId } = req.body as { eventId?: string };

  const eventIdValidation = eventIdSchema.safeParse(eventId);
  if (!eventIdValidation.success) {
    return res.status(400).json({ ok: false, error: eventIdValidation.error.issues[0].message });
  }
  const validatedEventId = eventIdValidation.data;

  const payloadValidation = registrationSchema.safeParse(req.body);
  if (!payloadValidation.success) {
    return res.status(400).json({ ok: false, error: payloadValidation.error.issues[0].message });
  }

  const supabase = createAnonClient();
  const data = payloadValidation.data;
  const email = data.email.toLowerCase().trim();

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, title, date, start_time, end_time, mode, registration_deadline, status')
    .eq('id', validatedEventId)
    .single();

  if (eventError || !event) {
    return res.status(400).json({ ok: false, error: 'This event is not available for public registration.' });
  }

  if (event.status !== 'published') {
    return res.status(400).json({ ok: false, error: 'Registration is closed for this event.' });
  }

  const now = new Date();
  const eventDate = new Date(`${event.date}T23:59:59`);
  if (event.registration_deadline && new Date(event.registration_deadline) < now) {
    return res.status(400).json({ ok: false, error: 'The registration deadline has passed for this event.' });
  }
  if (eventDate < now) {
    return res.status(400).json({ ok: false, error: 'Registration is closed because this event date has passed.' });
  }

  // Server-side rate limiting (60s per email)
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
      return res.status(429).json({ ok: false, error: 'Too many requests. Please wait a minute before registering again.' });
    }
  }

  await adminSupabase
    .from('rate_limits')
    .upsert({ key: rateLimitKey, last_attempt: new Date().toISOString() });

  const sanitizedData = {
    full_name: sanitizeText(data.fullName.trim()),
    email,
    phone: data.phone.trim(),
    college: sanitizeText(data.college.trim()),
    branch: sanitizeText(data.branch.trim()),
    year: data.year,
    coding_level: data.codingLevel,
    preferred_language: data.preferredLanguage,
    reason_to_join: data.reasonToJoin ? sanitizeText(data.reasonToJoin.trim()) : null,
    event_id: validatedEventId,
    attendance_status: 'registered' as const,
  };

  const { data: duplicateCheck } = await supabase
    .from('registrations')
    .select('id')
    .eq('event_id', validatedEventId)
    .eq('email', email)
    .limit(1);

  if (duplicateCheck && duplicateCheck.length > 0) {
    return res.status(409).json({ ok: false, error: 'This email is already registered for this event.' });
  }

  const { error: insertError } = await supabase
    .from('registrations')
    .insert(sanitizedData);

  if (insertError) {
    if (insertError.code === '23505') {
      return res.status(409).json({ ok: false, error: 'Duplicate registration detected.' });
    }
    console.error('Database insertion error:', insertError);
    return res.status(500).json({ ok: false, error: 'A system error occurred during registration. Please try again.' });
  }

  try {
    await sendRegistrationEmails(
      {
        full_name: sanitizedData.full_name,
        email: sanitizedData.email,
        college: sanitizedData.college,
        branch: sanitizedData.branch,
      },
      event
    );
  } catch (emailErr) {
    console.error('Non-critical: Email failed to send', emailErr);
  }

  return res.json({ ok: true, success: true });
});

export { router as eventsRouter };
