import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { createAnonClient } from '../middleware/auth';
import { registrationSchema } from '../lib/validation';
import { sendRegistrationEmails } from '../lib/registrationEmails';
import { cacheRoute } from '../lib/cache';
import { registrationRateLimiter } from '../middleware/rateLimit';

const router = Router();

function sanitizeText(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

router.get('/', cacheRoute(60, ['events'], 30), async (_req: Request, res: Response) => {
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

router.get('/featured', cacheRoute(60, ['events'], 30), async (_req: Request, res: Response) => {
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

router.get('/archive', cacheRoute(120, ['events'], 60), async (_req: Request, res: Response) => {
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

router.get('/workshops', cacheRoute(60, ['events'], 30), async (_req: Request, res: Response) => {
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

router.get('/options', cacheRoute(60, ['events'], 30), async (_req: Request, res: Response) => {
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

router.get('/slug/:slug', cacheRoute(60, ['events'], 30), async (req: Request, res: Response) => {
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

router.get('/slug/:slug/related', cacheRoute(60, ['events'], 30), async (req: Request, res: Response) => {
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

router.get('/community-links', cacheRoute(180, ['community_links'], 60), async (_req: Request, res: Response) => {
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

router.get('/announcements/latest', cacheRoute(60, ['announcements'], 30), async (_req: Request, res: Response) => {
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

router.post('/registrations', registrationRateLimiter, async (req: Request, res: Response) => {
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
    .select('id, title, date, start_time, end_time, mode, registration_deadline, status, event_type, meeting_link, short_description')
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

  // Non-blocking background email dispatch via background queue
  try {
    void sendRegistrationEmails(
      {
        full_name: sanitizedData.full_name,
        email: sanitizedData.email,
        phone: sanitizedData.phone,
        college: sanitizedData.college,
        branch: sanitizedData.branch,
        year: sanitizedData.year,
        coding_level: sanitizedData.coding_level,
        preferred_language: sanitizedData.preferred_language,
      },
      {
        title: event.title,
        date: event.date,
        start_time: event.start_time,
        end_time: event.end_time,
        mode: event.mode,
        event_type: event.event_type,
        meeting_link: event.meeting_link,
        short_description: event.short_description,
      }
    );
  } catch (emailErr) {
    console.error('Non-critical: Background email dispatch notification:', emailErr);
  }

  return res.json({ ok: true, success: true });
});

export { router as eventsRouter };
