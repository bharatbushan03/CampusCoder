import { Router, type Request, type Response } from 'express';
import { createAnonClient } from '../middleware/auth';
import { cacheRoute } from '../lib/cache';

const router = Router();

router.get('/', cacheRoute(60, ['resources'], 30), async (req: Request, res: Response) => {
  const supabase = createAnonClient();
  const { category, search } = req.query;

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

  return res.json({ ok: true, resources: data || [] });
});

export { router as resourcesRouter };
