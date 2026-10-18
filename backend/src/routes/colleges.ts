import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getAllColleges, ensureCollegeExists, removeCollegeFromMemory, DEFAULT_COLLEGE } from '../lib/collegesHelper';
import { autoSetupHackerRankCrewForCollege, getAllClubs, removeClubsByCollegeFromMemory, removeClubFromMemory } from '../lib/clubsHelper';
import { requireAuth, requireRole, type AuthedRequest } from '../middleware/auth';
import { createAdminClient } from '../utils/supabase/admin';
import { appCache } from '../lib/cache';

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

    const [clubs, eventsRes, profilesRes] = await Promise.all([
      getAllClubs(),
      supabase.from('events').select('id, college'),
      supabase.from('profiles').select('id, role, college, club_id'),
    ]);

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
    const { club, organizerAssigned } = await autoSetupHackerRankCrewForCollege(registered);
    return res.status(201).json({
      ok: true,
      college: registered,
      club,
      organizerAssigned,
    });
  } catch (err: any) {
    console.error('Error registering college:', err);
    return res.status(500).json({ ok: false, error: 'Failed to register college' });
  }
});

// DELETE /api/colleges/admin/:name - Delete campus, redirect students to MIET, demote organizers to MIET students
async function deleteCollegeHandler(req: AuthedRequest, res: Response) {
  const rawName = decodeURIComponent(req.params.name || '').trim();
  if (!rawName) {
    return res.status(400).json({ ok: false, error: 'College name is required' });
  }

  const norm = rawName.toUpperCase();
  if (norm === DEFAULT_COLLEGE.toUpperCase() || norm === 'MIET') {
    return res.status(400).json({
      ok: false,
      error: `Cannot delete default college (${DEFAULT_COLLEGE}). All other campuses cascade here.`,
    });
  }

  if (norm === 'ALL' || norm === 'ALL CAMPUSES') {
    return res.status(400).json({ ok: false, error: 'Cannot delete system-wide scope "ALL"' });
  }

  try {
    const supabase = createAdminClient();

    // 1. Find all clubs belonging to this college
    const { data: collegeClubs } = await supabase
      .from('clubs')
      .select('id, name, slug, college')
      .ilike('college', rawName);

    const clubs = collegeClubs || [];
    const clubIds = clubs.map((c) => c.id);

    // 2. Find all profiles belonging to this college
    const { data: collegeProfiles } = await supabase
      .from('profiles')
      .select('id, role, college, club_id')
      .ilike('college', rawName);

    const orgProfileIds: string[] = [];
    const studentProfileIds: string[] = [];
    const otherProfileIds: string[] = [];

    (collegeProfiles || []).forEach((p) => {
      if (p.role === 'organizer') {
        orgProfileIds.push(p.id);
      } else if (p.role === 'student') {
        studentProfileIds.push(p.id);
      } else {
        otherProfileIds.push(p.id);
      }
    });

    // Also include any organizers assigned to this college's clubs (even if college was different)
    if (clubIds.length > 0) {
      const { data: clubOrgs } = await supabase
        .from('profiles')
        .select('id, role')
        .in('club_id', clubIds);

      (clubOrgs || []).forEach((p) => {
        if (p.role === 'organizer' && !orgProfileIds.includes(p.id)) {
          orgProfileIds.push(p.id);
        }
      });
    }

    // 3. Demote ALL organizers from this college/clubs to students of MIET
    // "and organizer of that become students of miet also when we delete any clubs then there must be no organizer"
    if (orgProfileIds.length > 0) {
      await supabase
        .from('profiles')
        .update({ role: 'student', college: DEFAULT_COLLEGE, club_id: null })
        .in('id', orgProfileIds);

      await Promise.all(
        orgProfileIds.map(async (uid) => {
          try {
            await supabase.auth.admin.updateUserById(uid, {
              user_metadata: { role: 'student', college: DEFAULT_COLLEGE, club_id: null },
            });
          } catch (e) {
            console.warn(`[College Delete] Auth metadata update failed for organizer ${uid}:`, e);
          }
        })
      );
    }

    // 4. Redirect all students from this college to MIET
    // "and the students of that particicular college will be directed to miet college"
    if (studentProfileIds.length > 0) {
      await supabase
        .from('profiles')
        .update({ college: DEFAULT_COLLEGE, club_id: null })
        .in('id', studentProfileIds);

      await Promise.all(
        studentProfileIds.map(async (uid) => {
          try {
            await supabase.auth.admin.updateUserById(uid, {
              user_metadata: { college: DEFAULT_COLLEGE, club_id: null },
            });
          } catch (e) {
            console.warn(`[College Delete] Auth metadata update failed for student ${uid}:`, e);
          }
        })
      );
    }

    // 5. Update any remaining profiles (admins, etc.) registered with this college
    if (otherProfileIds.length > 0) {
      await supabase
        .from('profiles')
        .update({ college: DEFAULT_COLLEGE })
        .in('id', otherProfileIds);
    }

    // Direct safeguard: ensure any profiles with college matching rawName are now MIET
    await supabase
      .from('profiles')
      .update({ college: DEFAULT_COLLEGE, club_id: null })
      .ilike('college', rawName);

    // Direct safeguard: ensure no profiles hold deleted club_ids
    if (clubIds.length > 0) {
      await supabase
        .from('profiles')
        .update({ role: 'student', club_id: null })
        .in('club_id', clubIds);
    }

    // 6. Unlink and reassign events
    if (clubIds.length > 0) {
      await supabase
        .from('events')
        .update({ club_id: null, college: DEFAULT_COLLEGE })
        .in('club_id', clubIds);
    }
    await supabase
      .from('events')
      .update({ college: DEFAULT_COLLEGE })
      .ilike('college', rawName);

    // 7. Update notes and resources if applicable
    try {
      await Promise.all([
        supabase.from('notes').update({ college: DEFAULT_COLLEGE }).ilike('college', rawName),
        supabase.from('resources').update({ college: DEFAULT_COLLEGE }).ilike('college', rawName),
      ]);
    } catch {}

    // 8. Delete the clubs belonging to this college
    if (clubIds.length > 0) {
      const { error: clubDelErr } = await supabase
        .from('clubs')
        .delete()
        .in('id', clubIds);

      if (clubDelErr) {
        console.warn('[College Delete] Could not delete clubs, deactivating instead:', clubDelErr.message);
        await supabase.from('clubs').update({ is_active: false }).in('id', clubIds);
      }

      clubs.forEach((c) => {
        removeClubFromMemory(c.id);
        removeClubFromMemory(c.slug);
      });
    }
    removeClubsByCollegeFromMemory(rawName);

    // 9. Delete the college entry from colleges table
    try {
      await supabase.from('colleges').delete().ilike('name', rawName);
    } catch (e) {
      console.warn('[College Delete] Supabase delete from colleges table notice:', e);
    }

    // 10. Purge from in-memory college cache
    removeCollegeFromMemory(rawName);

    // 11. Invalidate caches
    await Promise.all([
      appCache.invalidateTags(['colleges', 'clubs', 'auth_sessions', 'admin_analytics', 'events']),
    ]);

    return res.json({
      ok: true,
      message: `Campus "${rawName}" deleted successfully. Students and organizers have been redirected to ${DEFAULT_COLLEGE}.`,
      stats: {
        studentsRedirected: studentProfileIds.length,
        organizersDemoted: orgProfileIds.length,
        clubsDeleted: clubIds.length,
      },
    });
  } catch (err: any) {
    console.error('[College Delete] Error deleting college:', err);
    return res.status(500).json({ ok: false, error: err.message || 'Failed to delete college' });
  }
}

router.delete('/admin/:name', requireAuth, requireRole('admin'), deleteCollegeHandler);
router.delete('/:name', requireAuth, requireRole('admin'), deleteCollegeHandler);

export const collegesRouter = router;


