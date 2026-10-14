import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getAllColleges, ensureCollegeExists, DEFAULT_COLLEGE } from '../lib/collegesHelper';
import { requireAuth, requireRole, type AuthedRequest } from '../middleware/auth';
import { createAdminClient } from '../utils/supabase/admin';

const router = Router();

const createCollegeSchema = z.object({
  name: z.string().min(2, 'College name must be at least 2 characters').max(200),
  code: z.string().max(20).optional(),
});

router.get('/', async (_req: Request, res: Response) => {
  try {
    const colleges = await getAllColleges();
    return res.json({ ok: true, colleges });
  } catch (err: any) {
    console.error('Error fetching colleges:', err);
    return res.json({ ok: true, colleges: [DEFAULT_COLLEGE] });
  }
});

// GET /api/colleges/overview - Admin view of all campuses with metrics and clubs
router.get('/overview', requireAuth, requireRole('admin'), async (_req: AuthedRequest, res: Response) => {
  try {
    const colleges = await getAllColleges();
    const supabase = createAdminClient();

    const [clubsRes, eventsRes, profilesRes] = await Promise.all([
      supabase.from('clubs').select('id, name, slug, description, category, college, is_active, created_at'),
      supabase.from('events').select('id, college'),
      supabase.from('profiles').select('id, role, college, club_id'),
    ]);

    const clubs = clubsRes.data || [];
    const events = eventsRes.data || [];
    const profiles = profilesRes.data || [];

    const campuses = colleges.map((collegeName) => {
      const norm = collegeName.trim().toUpperCase();
      const matchedClubs = clubs.filter(c => ((c.college || DEFAULT_COLLEGE).trim().toUpperCase() === norm));
      const matchedEvents = events.filter(e => ((e.college || DEFAULT_COLLEGE).trim().toUpperCase() === norm));
      const matchedProfiles = profiles.filter(p => (((p as any).college || DEFAULT_COLLEGE).trim().toUpperCase() === norm));
      const studentsCount = matchedProfiles.filter(p => p.role === 'student').length;
      const organizersCount = matchedProfiles.filter(p => p.role === 'organizer').length;

      return {
        name: collegeName,
        clubsCount: matchedClubs.length,
        eventsCount: matchedEvents.length,
        studentsCount,
        organizersCount,
        clubs: matchedClubs,
      };
    });

    return res.json({ ok: true, campuses });
  } catch (err: any) {
    console.error('Error fetching colleges overview:', err);
    return res.status(500).json({ ok: false, error: 'Failed to fetch colleges overview' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  const parsed = createCollegeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.issues[0].message });
  }

  try {
    const registered = await ensureCollegeExists(parsed.data.name);
    return res.status(201).json({ ok: true, college: registered });
  } catch (err: any) {
    console.error('Error registering college:', err);
    return res.status(500).json({ ok: false, error: 'Failed to register college' });
  }
});

export const collegesRouter = router;

