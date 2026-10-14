import { Router, type Request, type Response } from 'express';
import { createAnonClient, getOptionalSession, type AuthedRequest } from '../middleware/auth';
import { cacheRoute } from '../lib/cache';
import { queryAzure } from '../lib/azureDb';
import { DEFAULT_COLLEGE } from '../lib/collegesHelper';

const router = Router();

function matchesCollege(itemCollege: string | null | undefined, targetCollege: string | null | undefined): boolean {
  if (!targetCollege || targetCollege === 'all') return true;
  const col = (itemCollege || DEFAULT_COLLEGE).trim().toUpperCase();
  const target = targetCollege.trim().toUpperCase();
  return col === target;
}

router.get('/', cacheRoute(60, ['resources'], 30), async (req: Request, res: Response) => {
  const { category, search, college } = req.query;
  const { profile } = await getOptionalSession(req as AuthedRequest, res);
  const targetCollege = (profile?.role === 'student' || profile?.role === 'organizer')
    ? (profile.college || DEFAULT_COLLEGE)
    : ((college as string | undefined)?.trim() || null);

  const conditions: string[] = ['is_active = true'];
  const params: any[] = [];
  let paramIdx = 1;

  if (category && typeof category === 'string' && category !== 'all') {
    conditions.push(`category = $${paramIdx++}`);
    params.push(category);
  }

  if (search && typeof search === 'string' && search.trim()) {
    conditions.push(`(title ILIKE $${paramIdx} OR description ILIKE $${paramIdx})`);
    params.push(`%${search.trim()}%`);
  }

  const azureResources = await queryAzure(`SELECT * FROM public.resources WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`, params);
  if (azureResources !== null) {
    let filtered = azureResources.map((r: any) => ({ ...r, college: r.college || DEFAULT_COLLEGE }));
    if (targetCollege && targetCollege !== 'all') {
      filtered = filtered.filter((r: any) => matchesCollege(r.college, targetCollege));
    }
    return res.json({ ok: true, resources: filtered, source: 'azure' });
  }

  const supabase = createAnonClient();
  let query = supabase
    .from('resources')
    .select('*, events(title)')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (category && typeof category === 'string' && category !== 'all') {
    query = query.eq('category', category);
  }

  if (search && typeof search === 'string' && search.trim()) {
    query = query.or(`title.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`);
  }

  const { data, error } = await query;

  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
      console.warn('[Supabase] public.resources table not yet created in database. Run migration 20260529000002_add_resources_and_archive_fields.sql in Supabase SQL editor.');
      return res.json({ ok: true, resources: [] });
    }
    console.error('Error fetching public resources:', error);
    return res.status(500).json({ ok: false, error: 'Failed to load resources' });
  }

  let resources = (data || []).map((r: any) => ({
    ...r,
    college: r.college || DEFAULT_COLLEGE,
  }));
  if (targetCollege && targetCollege !== 'all') {
    resources = resources.filter((r: any) => matchesCollege(r.college, targetCollege));
  }

  return res.json({ ok: true, resources, source: 'supabase' });
});

export { router as resourcesRouter };
