import { Router, type Request, type Response } from 'express';
import { createAnonClient } from '../middleware/auth';
import { cacheRoute } from '../lib/cache';
import { queryAzure } from '../lib/azureDb';

const router = Router();

router.get('/', cacheRoute(60, ['resources'], 30), async (req: Request, res: Response) => {
  const { category, search } = req.query;
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
    return res.json({ ok: true, resources: azureResources, source: 'azure' });
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

  return res.json({ ok: true, resources: data || [], source: 'supabase' });
});

export { router as resourcesRouter };
