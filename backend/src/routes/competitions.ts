import { Router, type Request, type Response } from 'express';
import { createAnonClient } from '../middleware/auth';
import { cacheRoute } from '../lib/cache';

const router = Router();

router.get('/', cacheRoute(60, ['competitions'], 30), async (req: Request, res: Response) => {
  const supabase = createAnonClient();
  const { type, status, search } = req.query;

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
    console.error('Error fetching public competitions:', error);
    return res.status(500).json({ ok: false, error: 'Failed to load competitions' });
  }

  return res.json({ ok: true, competitions: data || [] });
});

export { router as competitionsRouter };
