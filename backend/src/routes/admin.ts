import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole, type AuthedRequest } from '../middleware/auth';
import { createAdminClient } from '../utils/supabase/admin';
import type { Database } from '../types/database.types';
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
  return text.trim();
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

const studentProfileUpdateSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  college: z.string().max(150).optional().nullable(),
  branch: z.string().max(100).optional().nullable(),
  year: z.string().max(20).optional().nullable(),
  role: z.enum(['student', 'admin', 'organizer']).optional(),
});

// ---------- Dashboard overview & Analytics ----------

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

router.get('/analytics', async (_req: Request, res: Response) => {
  const supabase = createAdminClient();

  const [profilesRes, eventsRes, registrationsRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, role, college, branch, year, created_at').order('created_at', { ascending: false }),
    supabase.from('events').select('id, title, slug, event_type, mode, date, status, created_at').order('date', { ascending: false }),
    supabase.from('registrations').select('id, full_name, email, college, branch, year, coding_level, preferred_language, attendance_status, registered_at, event_id').order('registered_at', { ascending: false }),
  ]);

  if (profilesRes.error || eventsRes.error || registrationsRes.error) {
    return res.status(500).json({ ok: false, error: 'Failed to compute analytics' });
  }

  const profiles = profilesRes.data || [];
  const events = eventsRes.data || [];
  const registrations = registrationsRes.data || [];

  const studentProfiles = profiles.filter((p) => p.role === 'student');
  const adminProfiles = profiles.filter((p) => p.role === 'admin');
  const organizerProfiles = profiles.filter((p) => p.role === 'organizer');

  const totalRegistrations = registrations.length;
  const attendedCount = registrations.filter((r) => r.attendance_status === 'attended').length;
  const attendanceRate = totalRegistrations > 0 ? Math.round((attendedCount / totalRegistrations) * 100) : 0;

  // 1. Timeline: Last 14 days activity
  const dateMap: Record<string, { date: string; registrations: number; signups: number }> = {};
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    dateMap[dateStr] = { date: dateStr, registrations: 0, signups: 0 };
  }

  registrations.forEach((r) => {
    const d = r.registered_at ? new Date(r.registered_at).toISOString().slice(0, 10) : '';
    if (dateMap[d]) {
      dateMap[d].registrations++;
    }
  });

  studentProfiles.forEach((p) => {
    const d = p.created_at ? new Date(p.created_at).toISOString().slice(0, 10) : '';
    if (dateMap[d]) {
      dateMap[d].signups++;
    }
  });

  const timeline = Object.values(dateMap);

  // 2. Events by Type
  const eventTypeCounts: Record<string, number> = {};
  events.forEach((ev) => {
    const t = ev.event_type || 'workshop';
    eventTypeCounts[t] = (eventTypeCounts[t] || 0) + 1;
  });
  const eventsByType = Object.entries(eventTypeCounts).map(([type, count]) => ({
    type: type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    count,
  }));

  // 3. Events by Status
  const eventStatusCounts: Record<string, number> = {};
  events.forEach((ev) => {
    const s = ev.status || 'draft';
    eventStatusCounts[s] = (eventStatusCounts[s] || 0) + 1;
  });
  const eventsByStatus = Object.entries(eventStatusCounts).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count,
  }));

  // 4. Top Events Performance
  const eventStatsMap: Record<string, { event: string; eventId: string; date: string; type: string; count: number; attended: number }> = {};
  events.forEach((ev) => {
    eventStatsMap[ev.id] = {
      event: ev.title,
      eventId: ev.id,
      date: ev.date,
      type: ev.event_type,
      count: 0,
      attended: 0,
    };
  });

  registrations.forEach((r) => {
    if (eventStatsMap[r.event_id]) {
      eventStatsMap[r.event_id].count++;
      if (r.attendance_status === 'attended') {
        eventStatsMap[r.event_id].attended++;
      }
    }
  });

  const topEvents = Object.values(eventStatsMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((e) => ({
      ...e,
      rate: e.count > 0 ? Math.round((e.attended / e.count) * 100) : 0,
    }));

  // 5. Top Colleges
  const collegeCounts: Record<string, number> = {};
  profiles.forEach((p) => {
    if (p.college && p.college.trim()) {
      const c = p.college.trim();
      collegeCounts[c] = (collegeCounts[c] || 0) + 1;
    }
  });
  registrations.forEach((r) => {
    if (r.college && r.college.trim() && !profiles.some((p) => p.email === r.email)) {
      const c = r.college.trim();
      collegeCounts[c] = (collegeCounts[c] || 0) + 1;
    }
  });

  const topColleges = Object.entries(collegeCounts)
    .map(([college, count]) => ({ college, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // 6. Branch Breakdown
  const branchCounts: Record<string, number> = {};
  profiles.forEach((p) => {
    if (p.branch && p.branch.trim()) {
      const b = p.branch.trim();
      branchCounts[b] = (branchCounts[b] || 0) + 1;
    }
  });
  const topBranches = Object.entries(branchCounts)
    .map(([branch, count]) => ({ branch, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // 7. Academic Year Breakdown
  const yearCounts: Record<string, number> = {};
  profiles.forEach((p) => {
    if (p.year && p.year.trim()) {
      const y = `Year ${p.year.trim()}`;
      yearCounts[y] = (yearCounts[y] || 0) + 1;
    }
  });
  const yearDistribution = Object.entries(yearCounts).map(([year, count]) => ({ year, count }));

  // 8. Coding Levels & Preferred Languages
  const levelCounts: Record<string, number> = {};
  const langCounts: Record<string, number> = {};
  registrations.forEach((r) => {
    if (r.coding_level) {
      const lvl = r.coding_level.charAt(0).toUpperCase() + r.coding_level.slice(1);
      levelCounts[lvl] = (levelCounts[lvl] || 0) + 1;
    }
    if (r.preferred_language) {
      const lang = r.preferred_language.trim();
      langCounts[lang] = (langCounts[lang] || 0) + 1;
    }
  });

  const codingLevels = Object.entries(levelCounts).map(([level, count]) => ({ level, count }));
  const preferredLanguages = Object.entries(langCounts)
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // 9. Recent Activity Feed
  const recentRegistrations = registrations.slice(0, 6).map((r) => ({
    id: r.id,
    type: 'registration' as const,
    name: r.full_name || r.email,
    email: r.email,
    event: eventStatsMap[r.event_id]?.event || 'Campus Event',
    time: r.registered_at,
    status: r.attendance_status,
  }));

  const recentSignups = profiles.slice(0, 6).map((p) => ({
    id: p.id,
    type: 'signup' as const,
    name: p.full_name || p.email,
    email: p.email,
    college: p.college,
    role: p.role,
    time: p.created_at,
  }));

  return res.json({
    ok: true,
    summary: {
      totalStudents: studentProfiles.length,
      totalAdmins: adminProfiles.length,
      totalOrganizers: organizerProfiles.length,
      totalEvents: events.length,
      publishedEvents: events.filter((e) => e.status === 'published').length,
      completedEvents: events.filter((e) => e.status === 'completed').length,
      totalRegistrations,
      attendedCount,
      attendanceRate,
    },
    timeline,
    eventsByType,
    eventsByStatus,
    topEvents,
    topColleges,
    topBranches,
    yearDistribution,
    codingLevels,
    preferredLanguages,
    recentRegistrations,
    recentSignups,
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

router.get('/students/:id', async (req: Request, res: Response) => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid student id' });
  }

  const supabase = createAdminClient();
  const [profileResult, registrationsResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', parsed.data).single(),
    supabase
      .from('registrations')
      .select('id, full_name, email, event_id, attendance_status, registered_at, events(title)')
      .eq('email', '')
      .order('registered_at', { ascending: false }),
  ]);

  if (profileResult.error || !profileResult.data) {
    return res.status(404).json({ ok: false, error: 'Student not found' });
  }

  // Fetch registrations by email of the profile (the profiles table is the
  // single source of truth — registrations are linked by email not profile id).
  const studentEmail = (profileResult.data as { email?: string | null }).email;
  let studentRegistrations: unknown[] = [];
  if (studentEmail) {
    const { data, error } = await supabase
      .from('registrations')
      .select('id, full_name, email, event_id, attendance_status, registered_at, events(title)')
      .eq('email', studentEmail)
      .order('registered_at', { ascending: false });
    if (!error && data) {
      studentRegistrations = data;
    }
  }

  // Suppress the unused-var lint for the throwaway registrationsResult
  // declared above so the parallel-shape is preserved if we extend it later.
  void registrationsResult;

  return res.json({
    ok: true,
    profile: profileResult.data,
    registrations: studentRegistrations,
  });
});

router.put('/students/:id', async (req: AuthedRequest, res: Response) => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid student id' });
  }

  const validation = studentProfileUpdateSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ ok: false, error: validation.error.issues[0].message });
  }

  // Block admins from demoting themselves — would lock them out of the console.
  if (validation.data.role && req.user?.id === parsed.data) {
    const isDemotion = validation.data.role !== 'admin';
    if (isDemotion) {
      return res.status(400).json({
        ok: false,
        error: 'You cannot demote your own admin account. Ask another admin to do this.',
      });
    }
  }

  // Coerce empty strings on optional text fields to null so they clear in DB.
  const payload: Database['public']['Tables']['profiles']['Update'] = { ...validation.data };
  if (payload.college !== undefined && typeof payload.college === 'string' && payload.college.trim() === '') {
    payload.college = null;
  }
  if (payload.branch !== undefined && typeof payload.branch === 'string' && payload.branch.trim() === '') {
    payload.branch = null;
  }
  if (payload.year !== undefined && typeof payload.year === 'string' && payload.year.trim() === '') {
    payload.year = null;
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', parsed.data);

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to update student profile' });
  }
  return res.json({ ok: true });
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

router.delete('/students/:id', async (req: AuthedRequest, res: Response) => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'Invalid student id' });
  }

  // Prevent self-deletion to avoid admin lockout
  if (req.user?.id === parsed.data) {
    return res.status(400).json({ ok: false, error: 'You cannot delete your own admin account.' });
  }

  const supabase = createAdminClient();

  // Retrieve student's email to clean up event registrations
  const { data: studentProfile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', parsed.data)
    .maybeSingle();

  if (studentProfile?.email) {
    try {
      await supabase.from('registrations').delete().eq('email', studentProfile.email);
    } catch (regErr) {
      console.warn('[Admin] Note cleaning up registrations on student deletion:', regErr);
    }
  }

  // Delete from public.profiles
  const { error } = await supabase.from('profiles').delete().eq('id', parsed.data);

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to delete student' });
  }

  // Also permanently delete user credentials from Supabase Auth (auth.users)
  try {
    await supabase.auth.admin.deleteUser(parsed.data);
  } catch (authErr) {
    console.warn('[Admin] Note deleting user from Supabase Auth:', authErr);
  }

  return res.json({ ok: true, success: true, message: 'Account permanently deleted from system.' });
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

// ---------- Showcase Projects Admin Management ----------

const showcaseUpdateSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  featured: z.boolean().optional(),
  title: z.string().min(2).max(100).optional(),
  tagline: z.string().min(5).max(200).optional(),
  category: z.string().optional(),
  stars: z.number().int().min(0).optional(),
});

router.get('/showcase', async (_req: Request, res: Response) => {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('showcase_projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[Admin] Failed to load showcase projects:', error.message);
    return res.json({ ok: true, projects: [] });
  }

  return res.json({ ok: true, projects: data || [] });
});

router.patch('/showcase/:id', async (req: Request, res: Response) => {
  const parsedId = idSchema.safeParse(req.params.id);
  if (!parsedId.success) {
    return res.status(400).json({ ok: false, error: 'Invalid project id' });
  }

  const parsedBody = showcaseUpdateSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({ ok: false, error: parsedBody.error.issues[0].message });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('showcase_projects')
    .update({
      ...parsedBody.data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsedId.data);

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to update showcase project' });
  }

  return res.json({ ok: true });
});

router.delete('/showcase/:id', async (req: Request, res: Response) => {
  const parsedId = idSchema.safeParse(req.params.id);
  if (!parsedId.success) {
    return res.status(400).json({ ok: false, error: 'Invalid project id' });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('showcase_projects')
    .delete()
    .eq('id', parsedId.data);

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to delete showcase project' });
  }

  return res.json({ ok: true });
});

export { router as adminRouter };
