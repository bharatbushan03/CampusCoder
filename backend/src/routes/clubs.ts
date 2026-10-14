import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole, getOptionalSession, type AuthedRequest } from '../middleware/auth';
import { createAdminClient } from '../utils/supabase/admin';
import { getAllClubs, getClubByIdOrSlug } from '../lib/clubsHelper';
import { appCache, cacheRoute } from '../lib/cache';
import { DEFAULT_COLLEGE } from '../lib/collegesHelper';

const router = Router();

const clubValidationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().max(1000).nullable().optional(),
  category: z.string().max(50).default('Technical'),
  college: z.string().max(100).nullable().optional(),
  logo_url: z.string().url().or(z.literal('')).nullable().optional(),
  banner_url: z.string().url().or(z.literal('')).nullable().optional(),
  is_active: z.boolean().default(true),
});

// GET /api/clubs - List public active clubs (optionally filtered by college)
router.get('/', cacheRoute(60, ['clubs'], 30), async (req: Request, res: Response) => {
  try {
    const clubs = await getAllClubs();
    let activeClubs = clubs.filter(c => c.is_active);

    // If college query param is specified, filter clubs by that college
    const collegeParam = (req.query.college as string | undefined)?.trim();
    if (collegeParam && collegeParam !== 'all') {
      activeClubs = activeClubs.filter(c => {
        const clubCollege = (c.college || DEFAULT_COLLEGE).trim().toUpperCase();
        return clubCollege === collegeParam.trim().toUpperCase();
      });
    }

    return res.json({ ok: true, clubs: activeClubs });
  } catch (_error: any) {
    return res.status(500).json({ ok: false, error: 'Failed to fetch clubs' });
  }
});

// GET /api/clubs/admin/all - List all clubs with statistics and organizers (for Admin & Organizers)
router.get('/admin/all', requireAuth, requireRole('admin', 'organizer'), async (req: AuthedRequest, res: Response) => {
  try {
    const clubs = await getAllClubs();
    const supabase = createAdminClient();

    const isGlobalAdmin = req.profile?.role === 'admin';
    const userCollege = (req.profile?.college || DEFAULT_COLLEGE).trim().toUpperCase();

    let targetClubs = clubs;
    if (!isGlobalAdmin) {
      targetClubs = clubs.filter(c => (c.college || DEFAULT_COLLEGE).trim().toUpperCase() === userCollege);
    }

    // Fetch profiles with organizer info and events
    const [profilesRes, eventsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, email, role, college, branch, year, club_id, created_at'),
      supabase.from('events').select('id, club_id')
    ]);

    let profiles = profilesRes.data || [];
    if (!isGlobalAdmin) {
      profiles = profiles.filter(p => (p.college || DEFAULT_COLLEGE).trim().toUpperCase() === userCollege);
    }
    const events = eventsRes.data || [];

    const statsMap: Record<string, { membersCount: number; organizers: any[]; eventsCount: number }> = {};

    targetClubs.forEach(c => {
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

    const enrichedClubs = targetClubs.map(c => ({
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

// GET /api/clubs/admin/candidates - Get students eligible to become organizers (Admin & Chapter Organizers)
// Strictly scoped to the specified club's or caller's campus/college
router.get('/admin/candidates', requireAuth, requireRole('admin', 'organizer'), async (req: AuthedRequest, res: Response) => {
  try {
    const isGlobalAdmin = req.profile?.role === 'admin';
    const userCollege = (req.profile?.college || DEFAULT_COLLEGE).trim();

    let targetCollege: string | null = null;
    const queryCollege = (req.query.college as string | undefined)?.trim();
    const queryClubId = (req.query.clubId as string | undefined)?.trim();

    if (!isGlobalAdmin) {
      // Organizers are strictly restricted to their own college/campus
      targetCollege = userCollege;
    } else if (queryClubId) {
      const club = await getClubByIdOrSlug(queryClubId);
      if (club && club.college) {
        targetCollege = club.college.trim();
      } else if (queryCollege) {
        targetCollege = queryCollege;
      }
    } else if (queryCollege) {
      targetCollege = queryCollege;
    }

    const supabase = createAdminClient();
    let query = supabase
      .from('profiles')
      .select('id, full_name, email, role, college, branch, year')
      .eq('role', 'student')
      .order('full_name', { ascending: true });

    if (targetCollege && targetCollege.toUpperCase() !== 'ALL') {
      query = query.ilike('college', targetCollege);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ ok: false, error: 'Failed to fetch candidate students' });
    }

    // Secondary strict filter in memory to ensure exact campus match (handles case-insensitivity & nulls)
    let candidates = data || [];
    if (targetCollege && targetCollege.toUpperCase() !== 'ALL') {
      const targetNorm = targetCollege.trim().toUpperCase();
      candidates = candidates.filter(
        (s) => ((s.college || DEFAULT_COLLEGE).trim().toUpperCase() === targetNorm)
      );
    }

    return res.json({ ok: true, students: candidates });
  } catch (_err: any) {
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

// POST /api/clubs/admin/:clubId/organizers - Appoint student as club organizer (Admin or Club Organizer)
router.post('/admin/:clubId/organizers', requireAuth, requireRole('admin', 'organizer'), async (req: AuthedRequest, res: Response) => {
  const { clubId } = req.params;
  const { studentId } = req.body;

  if (!studentId) {
    return res.status(400).json({ ok: false, error: 'Student ID is required' });
  }

  const isGlobalAdmin = req.profile?.role === 'admin';
  // Organizers can only appoint organizers to their own club
  if (!isGlobalAdmin && req.profile?.club_id !== clubId) {
    return res.status(403).json({ ok: false, error: 'You only have permission to appoint organizers for your own club.' });
  }

  try {
    const club = await getClubByIdOrSlug(clubId);
    if (!club) {
      return res.status(404).json({ ok: false, error: 'Club not found' });
    }

    const supabase = createAdminClient();

    // Fetch candidate student profile
    const { data: student, error: studentErr } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, college, branch, year')
      .eq('id', studentId)
      .single();

    if (studentErr || !student) {
      return res.status(404).json({ ok: false, error: 'Student profile not found' });
    }

    // STRICT CHECK: Student MUST belong to the SAME campus/college as the club!
    const clubCollege = (club.college || DEFAULT_COLLEGE).trim().toUpperCase();
    const studentCollege = ((student as any).college || DEFAULT_COLLEGE).trim().toUpperCase();
    if (clubCollege !== studentCollege) {
      return res.status(400).json({
        ok: false,
        error: `Cannot appoint student from ${student.college || 'another campus'} to ${club.name} at ${club.college || DEFAULT_COLLEGE}. Only students from the same campus can be appointed.`,
      });
    }

    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ role: 'organizer', club_id: clubId })
      .eq('id', studentId)
      .select('id, full_name, email, role, college, branch, year, club_id, created_at')
      .single();

    if (error || !updated) {
      return res.status(500).json({ ok: false, error: 'Failed to appoint organizer to club' });
    }

    // Update Supabase Auth user metadata
    try {
      await supabase.auth.admin.updateUserById(studentId, {
        user_metadata: { role: 'organizer', club_id: clubId },
      });
    } catch {}

    appCache.invalidateTags(['auth_sessions']);
    return res.json({ ok: true, organizer: updated });
  } catch (_err: any) {
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

// DELETE /api/clubs/admin/:clubId/organizers/:organizerId - Remove organizer from club (revert to student)
router.delete('/admin/:clubId/organizers/:organizerId', requireAuth, requireRole('admin', 'organizer'), async (req: AuthedRequest, res: Response) => {
  const { clubId, organizerId } = req.params;
  const isGlobalAdmin = req.profile?.role === 'admin';
  if (!isGlobalAdmin && req.profile?.club_id !== clubId) {
    return res.status(403).json({ ok: false, error: 'You only have permission to remove organizers from your own club.' });
  }

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
        college: parsed.data.college || DEFAULT_COLLEGE,
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
