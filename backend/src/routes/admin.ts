import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole, type AuthedRequest } from '../middleware/auth';
import { createAdminClient } from '../utils/supabase/admin';
import {
  announcementSchema,
  communityLinkSchema,
  eventSchema,
  resourceSchema,
} from '../lib/validation';

const router = Router();

router.use(requireAuth, requireRole('admin', 'organizer'));

function sanitizeText(text: string) {
  if (!text) return text;
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

type SpeakerPayload = {
  name: string;
  role?: string;
  email?: string;
  bio?: string;
  profile_image_url?: string;
};

const speakerSchema = z.object({
  name: z.string().min(1),
  role: z.string().optional(),
  email: z.string().optional(),
  bio: z.string().optional(),
  profile_image_url: z.string().optional(),
});

const idSchema = z.uuid('Invalid id');

// ---------- Dashboard overview ----------

router.get('/overview', async (_req: Request, res: Response) => {
  const supabase = createAdminClient();

  const [eventsResult, registrationsResult, studentsResult, announcementsResult, linksResult] =
    await Promise.all([
      supabase.from('events').select('*').order('date', { ascending: false }),
      supabase
        .from('registrations')
        .select('*, events(title)')
        .order('registered_at', { ascending: false }),
      supabase.from('profiles').select('id').eq('role', 'student'),
      supabase
        .from('announcements')
        .select('*, events(title)')
        .order('created_at', { ascending: false }),
      supabase.from('community_links').select('*'),
    ]);

  if (eventsResult.error || registrationsResult.error) {
    return res.status(500).json({ ok: false, error: 'Failed to load admin data' });
  }

  return res.json({
    ok: true,
    events: eventsResult.data,
    registrations: registrationsResult.data,
    studentCount: studentsResult.data?.length ?? 0,
    announcements: announcementsResult.error ? [] : announcementsResult.data,
    communityLinks: linksResult.error ? [] : linksResult.data,
  });
});

// ---------- Events ----------

router.get('/events', async (_req: Request, res: Response) => {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to load events' });
  }
  return res.json({ ok: true, events: data });
});

router.get('/events/options', async (_req: Request, res: Response) => {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('events')
    .select('id, title')
    .order('date', { ascending: false });

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to load events' });
  }
  return res.json({ ok: true, events: data });
});

router.get('/events/:id', async (req: Request, res: Response) => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid event id' });
  }

  const supabase = createAdminClient();
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', parsed.data)
    .single();

  if (error || !event) {
    return res.status(404).json({ ok: false, error: 'Event not found' });
  }

  const { data: owners } = await supabase
    .from('event_owners')
    .select('*')
    .eq('event_id', parsed.data);

  return res.json({ ok: true, event, owners: owners || [] });
});

router.post('/events', async (req: AuthedRequest, res: Response) => {
  const payload = req.body.payload ?? req.body;
  const speakersRaw = req.body.speakers ?? [];

  const validation = eventSchema.safeParse(payload);
  if (!validation.success) {
    return res.status(400).json({ ok: false, error: validation.error.issues[0].message });
  }

  const speakers = z.array(speakerSchema).safeParse(speakersRaw);
  if (!speakers.success) {
    return res.status(400).json({ ok: false, error: 'Invalid speakers data' });
  }

  const data = validation.data;
  const adminId = req.user?.id;

  const supabase = createAdminClient();
  const sanitizedEvent = {
    ...data,
    title: sanitizeText(data.title),
    short_description: data.short_description ? sanitizeText(data.short_description) : null,
    full_description: data.full_description ? sanitizeText(data.full_description) : null,
    banner_url: data.banner_url || null,
    created_by: adminId,
  };

  const { data: insertedEvent, error: eventError } = await supabase
    .from('events')
    .insert(sanitizedEvent)
    .select()
    .single();

  if (eventError) {
    if (eventError.code === '23505') {
      return res.status(409).json({ ok: false, error: 'An event with this slug already exists. Please choose a unique slug.' });
    }
    return res.status(500).json({ ok: false, error: eventError.message });
  }
  if (!insertedEvent) {
    return res.status(500).json({ ok: false, error: 'Event insertion failed.' });
  }

  if (speakers.data.length > 0) {
    const speakersToInsert = speakers.data.map((s: SpeakerPayload) => ({
      event_id: insertedEvent.id,
      name: sanitizeText(s.name),
      role: s.role ? sanitizeText(s.role) : null,
      email: s.email ? s.email.toLowerCase().trim() : null,
      bio: s.bio ? sanitizeText(s.bio) : null,
      profile_image_url: s.profile_image_url || null,
    }));

    const { error: speakersError } = await supabase.from('event_owners').insert(speakersToInsert);
    if (speakersError) {
      console.error('Failed to insert event owners:', speakersError);
    }
  }

  return res.json({ ok: true, success: true, eventId: insertedEvent.id });
});

router.put('/events/:id', async (req: Request, res: Response) => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid event id' });
  }

  const payload = req.body.payload ?? req.body;
  const speakersRaw = req.body.speakers ?? [];

  const validation = eventSchema.safeParse(payload);
  if (!validation.success) {
    return res.status(400).json({ ok: false, error: validation.error.issues[0].message });
  }

  const speakers = z.array(speakerSchema).safeParse(speakersRaw);
  if (!speakers.success) {
    return res.status(400).json({ ok: false, error: 'Invalid speakers data' });
  }

  const data = validation.data;
  const supabase = createAdminClient();

  const sanitizedEvent = {
    ...data,
    title: sanitizeText(data.title),
    short_description: data.short_description ? sanitizeText(data.short_description) : null,
    full_description: data.full_description ? sanitizeText(data.full_description) : null,
    banner_url: data.banner_url || null,
  };

  const { error: updateError } = await supabase
    .from('events')
    .update(sanitizedEvent)
    .eq('id', parsed.data);

  if (updateError) {
    if (updateError.code === '23505') {
      return res.status(409).json({ ok: false, error: 'An event with this slug already exists. Please choose a unique slug.' });
    }
    return res.status(500).json({ ok: false, error: updateError.message });
  }

  await supabase.from('event_owners').delete().eq('event_id', parsed.data);

  if (speakers.data.length > 0) {
    const speakersToInsert = speakers.data.map((s: SpeakerPayload) => ({
      event_id: parsed.data,
      name: sanitizeText(s.name),
      role: s.role ? sanitizeText(s.role) : null,
      email: s.email ? s.email.toLowerCase().trim() : null,
      bio: s.bio ? sanitizeText(s.bio) : null,
      profile_image_url: s.profile_image_url || null,
    }));

    await supabase.from('event_owners').insert(speakersToInsert);
  }

  return res.json({ ok: true, success: true });
});

router.patch('/events/:id/status', async (req: Request, res: Response) => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid event id' });
  }

  const statusSchema = z.enum(['draft', 'published', 'completed', 'cancelled']);
  const parsedStatus = statusSchema.safeParse(req.body.status);
  if (!parsedStatus.success) {
    return res.status(400).json({ ok: false, error: 'Invalid status' });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('events')
    .update({ status: parsedStatus.data })
    .eq('id', parsed.data);

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to update event status' });
  }
  return res.json({ ok: true });
});

router.patch('/events/:id/meeting-link', async (req: Request, res: Response) => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid event id' });
  }

  const linkSchema = z.union([z.url('Invalid URL'), z.literal('')]);
  const parsedLink = linkSchema.safeParse(req.body.meeting_link);
  if (!parsedLink.success) {
    return res.status(400).json({ ok: false, error: parsedLink.error.issues[0].message });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('events')
    .update({ meeting_link: parsedLink.data || null })
    .eq('id', parsed.data);

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to save meeting link' });
  }
  return res.json({ ok: true });
});

router.patch('/events/:id/archive', async (req: Request, res: Response) => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid event id' });
  }

  const archiveSchema = z.object({
    recording_url: z.union([z.url(), z.literal(''), z.string().max(500)]).optional(),
    summary: z.string().max(5000).optional(),
  });
  const parsedData = archiveSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.status(400).json({ ok: false, error: 'Invalid archive data' });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('events')
    .update(parsedData.data)
    .eq('id', parsed.data);

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to save archive details' });
  }
  return res.json({ ok: true });
});

router.delete('/events/:id', async (req: Request, res: Response) => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid event id' });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from('events').delete().eq('id', parsed.data);

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to delete event' });
  }
  return res.json({ ok: true });
});

router.get('/events/:id/registrations', async (req: Request, res: Response) => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid event id' });
  }

  const supabase = createAdminClient();
  const [eventResult, regsResult] = await Promise.all([
    supabase.from('events').select('title').eq('id', parsed.data).single(),
    supabase
      .from('registrations')
      .select('*, events(title)')
      .eq('event_id', parsed.data)
      .order('registered_at', { ascending: false }),
  ]);

  if (eventResult.error || regsResult.error) {
    return res.status(500).json({ ok: false, error: 'Failed to load registrations' });
  }
  return res.json({ ok: true, event: eventResult.data, registrations: regsResult.data });
});

// ---------- Registrations ----------

router.get('/registrations', async (req: Request, res: Response) => {
  const supabase = createAdminClient();
  const eventId = req.query.eventId as string | undefined;

  let query = supabase
    .from('registrations')
    .select('*, events(title)')
    .order('registered_at', { ascending: false });

  if (eventId) {
    query = query.eq('event_id', eventId);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to load registrations' });
  }
  return res.json({ ok: true, registrations: data });
});

router.patch('/registrations/:id/attendance', async (req: Request, res: Response) => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid registration id' });
  }

  const statusSchema = z.enum(['registered', 'attended', 'absent']);
  const parsedStatus = statusSchema.safeParse(req.body.attendance_status);
  if (!parsedStatus.success) {
    return res.status(400).json({ ok: false, error: 'Invalid attendance status' });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('registrations')
    .update({ attendance_status: parsedStatus.data })
    .eq('id', parsed.data);

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to update attendance' });
  }
  return res.json({ ok: true });
});

router.delete('/registrations/:id', async (req: Request, res: Response) => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid registration id' });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from('registrations').delete().eq('id', parsed.data);

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to delete registration' });
  }
  return res.json({ ok: true });
});

// ---------- Students ----------

router.get('/students', async (_req: Request, res: Response) => {
  const supabase = createAdminClient();
  const [profilesResult, registrationsResult] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase
      .from('registrations')
      .select('full_name, email, event_id, attendance_status, registered_at, events(title)'),
  ]);

  if (profilesResult.error) {
    return res.status(500).json({ ok: false, error: 'Failed to load students' });
  }
  return res.json({
    ok: true,
    profiles: profilesResult.data,
    registrations: registrationsResult.error ? [] : registrationsResult.data,
  });
});

router.patch('/students/:id', async (req: Request, res: Response) => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid student id' });
  }

  const roleSchema = z.enum(['student', 'admin', 'organizer']);
  const parsedRole = roleSchema.safeParse(req.body.role);
  if (!parsedRole.success) {
    return res.status(400).json({ ok: false, error: 'Invalid role' });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('profiles')
    .update({ role: parsedRole.data })
    .eq('id', parsed.data);

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to update role' });
  }
  return res.json({ ok: true });
});

router.delete('/students/:id', async (req: Request, res: Response) => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid student id' });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from('profiles').delete().eq('id', parsed.data);

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to delete student' });
  }
  return res.json({ ok: true });
});

// ---------- Announcements ----------

router.get('/announcements', async (_req: Request, res: Response) => {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('announcements')
    .select('*, events(title)')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to load announcements' });
  }
  return res.json({ ok: true, announcements: data });
});

router.get('/announcements/:id', async (req: Request, res: Response) => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid announcement id' });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('id', parsed.data)
    .single();

  if (error || !data) {
    return res.status(404).json({ ok: false, error: 'Announcement not found' });
  }
  return res.json({ ok: true, announcement: data });
});

router.post('/announcements', async (req: AuthedRequest, res: Response) => {
  const validation = announcementSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ ok: false, error: validation.error.issues[0].message });
  }

  const { publish_date, ...data } = validation.data;
  const supabase = createAdminClient();
  const { error } = await supabase.from('announcements').insert({
    ...data,
    title: sanitizeText(data.title),
    message: sanitizeText(data.message),
    created_by: req.user?.id,
  });

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to create announcement' });
  }
  return res.json({ ok: true, success: true });
});

router.put('/announcements/:id', async (req: Request, res: Response) => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid announcement id' });
  }

  const validation = announcementSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ ok: false, error: validation.error.issues[0].message });
  }

  const { publish_date, ...data } = validation.data;
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('announcements')
    .update({
      ...data,
      title: sanitizeText(data.title),
      message: sanitizeText(data.message),
    })
    .eq('id', parsed.data);

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to update announcement' });
  }
  return res.json({ ok: true });
});

router.patch('/announcements/:id/toggle', async (req: Request, res: Response) => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid announcement id' });
  }

  const supabase = createAdminClient();
  const { data: current } = await supabase
    .from('announcements')
    .select('is_active')
    .eq('id', parsed.data)
    .single();

  const { error } = await supabase
    .from('announcements')
    .update({ is_active: !current?.is_active })
    .eq('id', parsed.data);

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to toggle announcement' });
  }
  return res.json({ ok: true });
});

router.delete('/announcements/:id', async (req: Request, res: Response) => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid announcement id' });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from('announcements').delete().eq('id', parsed.data);

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to delete announcement' });
  }
  return res.json({ ok: true });
});

// ---------- Community links ----------

router.get('/community-links', async (_req: Request, res: Response) => {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('community_links')
    .select('*')
    .order('platform', { ascending: true });

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to load community links' });
  }
  return res.json({ ok: true, links: data });
});

router.get('/community-links/:id', async (req: Request, res: Response) => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid link id' });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('community_links')
    .select('*')
    .eq('id', parsed.data)
    .single();

  if (error || !data) {
    return res.status(404).json({ ok: false, error: 'Community link not found' });
  }
  return res.json({ ok: true, link: data });
});

router.post('/community-links', async (req: Request, res: Response) => {
  const validation = communityLinkSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ ok: false, error: validation.error.issues[0].message });
  }

  const data = validation.data;
  const supabase = createAdminClient();
  const { error } = await supabase.from('community_links').insert({
    ...data,
    platform: sanitizeText(data.platform),
    url: data.url.toLowerCase().trim(),
  });

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to create community link' });
  }
  return res.json({ ok: true, success: true });
});

router.put('/community-links/:id', async (req: Request, res: Response) => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid link id' });
  }

  const validation = communityLinkSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ ok: false, error: validation.error.issues[0].message });
  }

  const data = validation.data;
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('community_links')
    .update({
      ...data,
      platform: sanitizeText(data.platform),
      url: data.url.toLowerCase().trim(),
    })
    .eq('id', parsed.data);

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to update community link' });
  }
  return res.json({ ok: true });
});

router.patch('/community-links/:id/toggle', async (req: Request, res: Response) => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid link id' });
  }

  const supabase = createAdminClient();
  const { data: current } = await supabase
    .from('community_links')
    .select('is_active')
    .eq('id', parsed.data)
    .single();

  const { error } = await supabase
    .from('community_links')
    .update({ is_active: !current?.is_active })
    .eq('id', parsed.data);

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to toggle community link' });
  }
  return res.json({ ok: true });
});

router.delete('/community-links/:id', async (req: Request, res: Response) => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid link id' });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from('community_links').delete().eq('id', parsed.data);

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to delete community link' });
  }
  return res.json({ ok: true });
});

// ---------- Resources ----------

router.get('/resources', async (_req: Request, res: Response) => {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('resources')
    .select('*, events(title)')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to load resources' });
  }
  return res.json({ ok: true, resources: data });
});

router.get('/resources/:id', async (req: Request, res: Response) => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid resource id' });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('id', parsed.data)
    .single();

  if (error || !data) {
    return res.status(404).json({ ok: false, error: 'Resource not found' });
  }
  return res.json({ ok: true, resource: data });
});

router.post('/resources', async (req: Request, res: Response) => {
  const validation = resourceSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ ok: false, error: validation.error.issues[0].message });
  }

  const data = validation.data;
  const supabase = createAdminClient();
  const { error } = await supabase.from('resources').insert({
    ...data,
    title: sanitizeText(data.title),
    description: data.description ? sanitizeText(data.description) : null,
    link: data.link.toLowerCase().trim(),
  });

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to create resource' });
  }
  return res.json({ ok: true, success: true });
});

router.put('/resources/:id', async (req: Request, res: Response) => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid resource id' });
  }

  const validation = resourceSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ ok: false, error: validation.error.issues[0].message });
  }

  const data = validation.data;
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('resources')
    .update({
      ...data,
      title: sanitizeText(data.title),
      description: data.description ? sanitizeText(data.description) : null,
      link: data.link.toLowerCase().trim(),
    })
    .eq('id', parsed.data);

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to update resource' });
  }
  return res.json({ ok: true });
});

router.patch('/resources/:id/toggle', async (req: Request, res: Response) => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid resource id' });
  }

  const supabase = createAdminClient();
  const { data: current } = await supabase
    .from('resources')
    .select('is_active')
    .eq('id', parsed.data)
    .single();

  const { error } = await supabase
    .from('resources')
    .update({ is_active: !current?.is_active })
    .eq('id', parsed.data);

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to toggle resource' });
  }
  return res.json({ ok: true });
});

router.delete('/resources/:id', async (req: Request, res: Response) => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid resource id' });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from('resources').delete().eq('id', parsed.data);

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to delete resource' });
  }
  return res.json({ ok: true });
});

export { router as adminRouter };
