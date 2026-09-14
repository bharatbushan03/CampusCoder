import { Router, type Request, type Response } from 'express';
import { createAnonClient } from '../middleware/auth';
import { cacheRoute } from '../lib/cache';
import { queryAzure } from '../lib/azureDb';

const router = Router();

router.get('/', cacheRoute(60, ['competitions'], 30), async (req: Request, res: Response) => {
  const { type, status, search } = req.query;

  // 1. Try Azure Database first if configured & healthy
  const conditions: string[] = ['is_active = true'];
  const params: any[] = [];
  let paramIdx = 1;

  if (type && typeof type === 'string' && type !== 'all') {
    conditions.push(`type = $${paramIdx++}`);
    params.push(type);
  }
  if (status && typeof status === 'string' && status !== 'all') {
    conditions.push(`status = $${paramIdx++}`);
    params.push(status);
  }
  if (search && typeof search === 'string' && search.trim()) {
    conditions.push(`(title ILIKE $${paramIdx} OR description ILIKE $${paramIdx} OR platform ILIKE $${paramIdx})`);
    params.push(`%${search.trim()}%`);
    paramIdx++;
  }

  const azureSql = `SELECT * FROM public.competitions WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`;
  const azureCompetitions = await queryAzure(azureSql, params);
  if (azureCompetitions !== null) {
    return res.json({ ok: true, competitions: azureCompetitions, source: 'azure' });
  }

  // 2. Resilient Supabase fallback
  const supabase = createAnonClient();
  let query = supabase
    .from('competitions')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (type && typeof type === 'string' && type !== 'all') {
    query = query.eq('type', type);
  }

  if (status && typeof status === 'string' && status !== 'all') {
    query = query.eq('status', status);
  }

  if (search && typeof search === 'string' && search.trim()) {
    query = query.or(`title.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%,platform.ilike.%${search.trim()}%`);
  }

  const { data, error } = await query;

  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
      console.warn('[Supabase] public.competitions table not yet created in database. Run migration 20260830000000_create_competitions.sql in Supabase SQL editor.');
      return res.json({ ok: true, competitions: [] });
    }
    console.error('Error fetching public competitions:', error);
    return res.status(500).json({ ok: false, error: 'Failed to load competitions' });
  }

  return res.json({ ok: true, competitions: data || [], source: 'supabase' });
});

export { router as competitionsRouter };

