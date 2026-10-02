import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole, getOptionalSession, type AuthedRequest } from '../middleware/auth';
import { createAdminClient } from '../utils/supabase/admin';
import { getAllClubs, getClubByIdOrSlug } from '../lib/clubsHelper';
import { appCache, cacheRoute } from '../lib/cache';

const router = Router();

const clubValidationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().max(1000).nullable().optional(),
  category: z.string().max(50).default('Technical'),
  logo_url: z.string().url().or(z.literal('')).nullable().optional(),
  banner_url: z.string().url().or(z.literal('')).nullable().optional(),
  is_active: z.boolean().default(true),
});

// GET /api/clubs - List public active clubs
router.get('/', cacheRoute(60, ['clubs'], 30), async (_req: Request, res: Response) => {
  try {
    const clubs = await getAllClubs();
    return res.json({ ok: true, clubs: clubs.filter(c => c.is_active) });
  } catch (_error: any) {
    return res.status(500).json({ ok: false, error: 'Failed to fetch clubs' });
  }
});

// GET /api/clubs/admin/all - List all clubs with statistics and organizers (for Admin & Organizers)
router.get('/admin/all', requireAuth, requireRole('admin', 'organizer'), async (req: AuthedRequest, res: Response) => {
  try {
    const clubs = await getAllClubs();
    const supabase = createAdminClient();

    // Fetch profiles with organizer info and events
    const [profilesRes, eventsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, email, role, college, branch, year, club_id, created_at'),
      supabase.from('events').select('id, club_id')
    ]);

    const profiles = profilesRes.data || [];
    const events = eventsRes.data || [];

    const statsMap: Record<string, { membersCount: number; organizers: any[]; eventsCount: number }> = {};

    clubs.forEach(c => {
      statsMap[c.id] = { membersCount: 0, organizers: [], eventsCount: 0 };
    });

    profiles.forEach(p => {
      if (p.role === 'organizer' && p.club_id && statsMap[p.club_id]) {
        statsMap[p.club_id].organizers.push({
          id: p.id,
          full_name: p.full_name,
          email: p.email,
          role: p.role,
          college: p.college,
          branch: p.branch,
          year: p.year,
          created_at: p.created_at,
        });
      }
    });

    events.forEach(e => {
      const cId = (e as any).club_id;
      if (cId && statsMap[cId]) {
        statsMap[cId].eventsCount++;
      }
    });

    const enrichedClubs = clubs.map(c => ({
      ...c,
      membersCount: statsMap[c.id]?.membersCount || 0,
      organizersCount: statsMap[c.id]?.organizers.length || 0,
      organizers: statsMap[c.id]?.organizers || [],
      eventsCount: statsMap[c.id]?.eventsCount || 0,
    }));

    return res.json({ ok: true, clubs: enrichedClubs });
  } catch (error: any) {
    console.error('Error fetching admin clubs:', error);
    return res.status(500).json({ ok: false, error: 'Failed to load clubs overview' });
  }
});

// GET /api/clubs/admin/candidates - Get students eligible to become organizers (Admin only)
router.get('/admin/candidates', requireAuth, requireRole('admin'), async (_req: AuthedRequest, res: Response) => {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, college, branch, year')
      .eq('role', 'student')
      .order('full_name', { ascending: true });

    if (error) {
      return res.status(500).json({ ok: false, error: 'Failed to fetch candidate students' });
    }
    return res.json({ ok: true, students: data || [] });
  } catch (_err: any) {
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

// POST /api/clubs/admin/:clubId/organizers - Appoint student as club organizer (Admin only)
router.post('/admin/:clubId/organizers', requireAuth, requireRole('admin'), async (req: AuthedRequest, res: Response) => {
  const { clubId } = req.params;
  const { studentId } = req.body;

  if (!studentId) {
    return res.status(400).json({ ok: false, error: 'Student ID is required' });
  }

  try {
    const supabase = createAdminClient();
    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ role: 'organizer', club_id: clubId })
      .eq('id', studentId)
      .select('id, full_name, email, role, college, branch, year, club_id, created_at')
      .single();

    if (error || !updated) {
      return res.status(500).json({ ok: false, error: 'Failed to appoint organizer to club' });
    }

    appCache.invalidateTags(['auth_sessions']);
    return res.json({ ok: true, organizer: updated });
  } catch (_err: any) {
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

// DELETE /api/clubs/admin/:clubId/organizers/:organizerId - Remove organizer from club (revert to student)
router.delete('/admin/:clubId/organizers/:organizerId', requireAuth, requireRole('admin'), async (req: AuthedRequest, res: Response) => {
  const { clubId, organizerId } = req.params;

  try {
    const supabase = createAdminClient();
    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ role: 'student', club_id: null })
      .eq('id', organizerId)
      .eq('club_id', clubId)
      .select('id, full_name, email, role')
      .single();

    if (error || !updated) {
      return res.status(500).json({ ok: false, error: 'Failed to remove organizer' });
    }

    appCache.invalidateTags(['auth_sessions']);
    return res.json({ ok: true, student: updated });
  } catch (_err: any) {
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

// GET /api/clubs/:idOrSlug - Get basic details of a single club
router.get('/:idOrSlug', async (req: Request, res: Response) => {
  try {
    const club = await getClubByIdOrSlug(req.params.idOrSlug);
    if (!club) {
      return res.status(404).json({ ok: false, error: 'Club not found' });
    }
    return res.json({ ok: true, club });
  } catch (_error: any) {
    return res.status(500).json({ ok: false, error: 'Error fetching club' });
  }
});

// GET /api/clubs/:idOrSlug/details - Get club overview, events, and community organizers
router.get('/:idOrSlug/details', async (req: Request, res: Response) => {
  try {
    const club = await getClubByIdOrSlug(req.params.idOrSlug);
    if (!club) {
      return res.status(404).json({ ok: false, error: 'Club not found' });
    }

    const { profile } = await getOptionalSession(req, res);
    const isGlobalAdmin = profile?.role === 'admin';
    const isOrganizer = profile?.role === 'organizer';
    const canViewOrganizers = isGlobalAdmin || isOrganizer;
    const supabase = createAdminClient();

    // Fetch events of this club
    const { data: events } = await supabase
      .from('events')
      .select('id, title, slug, event_type, mode, date, start_time, end_time, status')
      .eq('club_id', club.id)
      .order('date', { ascending: false });

    // Fetch organizer count
    const { count: organizerCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'organizer')
      .eq('club_id', club.id);

    let organizers: any[] = [];
    if (canViewOrganizers) {
      // Community organizers are shown in the club/community section
      const { data: orgProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, college, branch, year, created_at')
        .eq('role', 'organizer')
        .eq('club_id', club.id);
      organizers = orgProfiles || [];
    }

    return res.json({
      ok: true,
      club,
      events: events || [],
      organizer_count: organizerCount || 0,
      can_view_organizers: canViewOrganizers,
      organizers,
    });
  } catch (error: any) {
    console.error('Error fetching club details:', error);
    return res.status(500).json({ ok: false, error: 'Failed to load club details' });
  }
});

// POST /api/clubs/admin - Create new club (Admin only)
router.post('/admin', requireAuth, requireRole('admin'), async (req: AuthedRequest, res: Response) => {
  const parsed = clubValidationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.issues[0].message });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('clubs')
      .insert({
        name: parsed.data.name,
        slug: parsed.data.slug.toLowerCase(),
        description: parsed.data.description || null,
        category: parsed.data.category,
        logo_url: parsed.data.logo_url || null,
        banner_url: parsed.data.banner_url || null,
        is_active: parsed.data.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ ok: false, error: 'A club with this slug already exists.' });
      }
      return res.status(500).json({ ok: false, error: error.message });
    }

    await appCache.invalidateTags(['clubs']);
    return res.json({ ok: true, club: data });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message || 'Error creating club' });
  }
});

// PUT /api/clubs/admin/:id - Update club (Admin or Organizer of this club)
router.put('/admin/:id', requireAuth, requireRole('admin', 'organizer'), async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;

  // Organizers can only update their own club
  if (req.profile?.role === 'organizer' && req.profile.club_id !== id) {
    return res.status(403).json({ ok: false, error: 'You only have permission to edit your own club.' });
  }

  const parsed = clubValidationSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.issues[0].message });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('clubs')
      .update(parsed.data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }

    await appCache.invalidateTags(['clubs']);
    return res.json({ ok: true, club: data });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message || 'Error updating club' });
  }
});

// DELETE /api/clubs/admin/:id - Delete / deactivate club (Admin only)
router.delete('/admin/:id', requireAuth, requireRole('admin'), async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('clubs')
      .delete()
      .eq('id', id);

    if (error) {
      // Fallback: deactivate if deletion violates FK constraints
      await supabase.from('clubs').update({ is_active: false }).eq('id', id);
    }

    await appCache.invalidateTags(['clubs']);
    return res.json({ ok: true, message: 'Club deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message || 'Error deleting club' });
  }
});

export { router as clubsRouter };
