import { Router, type Request, type Response } from 'express';
import { createAnonClient } from '../middleware/auth';
import { cacheRoute } from '../lib/cache';
import { queryAzure } from '../lib/azureDb';

const router = Router();

router.get('/', cacheRoute(60, ['notes'], 30), async (req: Request, res: Response) => {
  const { year, semester, search } = req.query;

  // 1. Try Azure Database first if configured & healthy
  const conditions: string[] = ['is_active = true'];
  const params: any[] = [];
  let paramIdx = 1;

  if (year && typeof year === 'string' && year !== 'all') {
    conditions.push(`year = $${paramIdx++}`);
    params.push(year);
  }
  if (semester && typeof semester === 'string' && semester !== 'all') {
    conditions.push(`semester = $${paramIdx++}`);
    params.push(semester);
  }
  if (search && typeof search === 'string' && search.trim()) {
    conditions.push(`(title ILIKE $${paramIdx} OR code ILIKE $${paramIdx} OR description ILIKE $${paramIdx} OR subject ILIKE $${paramIdx})`);
    params.push(`%${search.trim()}%`);
    paramIdx++;
  }

  const azureSql = `SELECT * FROM public.notes WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`;
  const azureNotes = await queryAzure(azureSql, params);
  if (azureNotes !== null) {
    return res.json({ ok: true, notes: azureNotes, source: 'azure' });
  }

  // 2. Resilient Supabase fallback
  const supabase = createAnonClient();
  let query = supabase
    .from('notes')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (year && typeof year === 'string' && year !== 'all') {
    query = query.eq('year', year);
  }

  if (semester && typeof semester === 'string' && semester !== 'all') {
    query = query.eq('semester', semester);
  }

  if (search && typeof search === 'string' && search.trim()) {
    query = query.or(`title.ilike.%${search.trim()}%,code.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%,subject.ilike.%${search.trim()}%`);
  }

  const { data, error } = await query;

  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
      console.warn('[Supabase] public.notes table not yet created in database. Run migration 20260830000001_create_notes.sql in Supabase SQL editor.');
      return res.json({ ok: true, notes: [] });
    }
    console.error('Error fetching public notes:', error);
    return res.status(500).json({ ok: false, error: 'Failed to load notes' });
  }

  return res.json({ ok: true, notes: data || [], source: 'supabase' });
});

export { router as notesRouter };

