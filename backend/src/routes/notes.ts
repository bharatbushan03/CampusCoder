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

/**
 * GET /api/notes/folders
 * Fetch folders for a subject code (optionally nested by parent_id)
 */
router.get('/folders', cacheRoute(30, ['notes', 'note_folders'], 15), async (req: Request, res: Response) => {
  const { subject_code, code, parent_id, college } = req.query;
  const targetSubject = (subject_code || code) as string | undefined;
  const { profile } = await getOptionalSession(req as AuthedRequest, res);
  const targetCollege = (profile?.role === 'student' || profile?.role === 'organizer')
    ? (profile.college || DEFAULT_COLLEGE)
    : ((college as string | undefined)?.trim() || null);

  // 1. Try Azure DB
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  if (targetSubject && targetSubject.trim()) {
    conditions.push(`subject_code = $${paramIdx++}`);
    params.push(targetSubject.trim());
  }

  if (parent_id === 'root') {
    conditions.push(`parent_id IS NULL`);
  } else if (parent_id && typeof parent_id === 'string' && parent_id !== 'all') {
    conditions.push(`parent_id = $${paramIdx++}`);
    params.push(parent_id);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const azureSql = `
    SELECT f.*, 
           (SELECT COUNT(*)::int FROM public.notes n WHERE n.folder_id = f.id AND n.is_active = true) AS document_count
    FROM public.note_folders f
    ${whereClause}
    ORDER BY f.created_at ASC
  `;

  const azureFolders = await queryAzure(azureSql, params);
  if (azureFolders !== null) {
    let filtered = azureFolders.map((f: any) => ({ ...f, college: f.college || DEFAULT_COLLEGE }));
    if (targetCollege && targetCollege !== 'all') {
      filtered = filtered.filter((f: any) => matchesCollege(f.college, targetCollege));
    }
    return res.json({ ok: true, folders: filtered, source: 'azure' });
  }

  // 2. Supabase Fallback
  const supabase = createAnonClient();
  try {
    let query = supabase.from('note_folders').select('*').order('created_at', { ascending: true });

    if (targetSubject && targetSubject.trim()) {
      query = query.eq('subject_code', targetSubject.trim());
    }

    if (parent_id === 'root') {
      query = query.is('parent_id', null);
    } else if (parent_id && typeof parent_id === 'string' && parent_id !== 'all') {
      query = query.eq('parent_id', parent_id);
    }

    const { data: folders, error } = await query;
    if (error) {
      if (error.code === 'PGRST205' || error.code === 'PGRST204' || error.message?.includes('Could not find the table') || error.message?.includes('schema cache')) {
        return res.json({ ok: true, folders: [], source: 'empty' });
      }
      console.error('Error fetching note folders:', error);
      return res.status(500).json({ ok: false, error: 'Failed to load folders' });
    }

    // Attach document counts
    const folderList = folders || [];
    const countMap: Record<string, number> = {};
    if (folderList.length > 0) {
      const folderIds = folderList.map(f => f.id);
      const { data: docCounts } = await supabase
        .from('notes')
        .select('folder_id')
        .in('folder_id', folderIds)
        .eq('is_active', true);

      (docCounts || []).forEach((d: { folder_id: string | null }) => {
        if (d.folder_id) {
          countMap[d.folder_id] = (countMap[d.folder_id] || 0) + 1;
        }
      });
    }

    let enriched = folderList.map(f => ({
      ...f,
      college: (f as any).college || DEFAULT_COLLEGE,
      document_count: countMap[f.id] || 0,
    }));

    if (targetCollege && targetCollege !== 'all') {
      enriched = enriched.filter((f: any) => matchesCollege(f.college, targetCollege));
    }

    return res.json({ ok: true, folders: enriched, source: 'supabase' });
  } catch (err: any) {
    console.error('Unexpected error fetching folders:', err);
    return res.status(500).json({ ok: false, error: 'Failed to load folders' });
  }
});

/**
 * GET /api/notes
 * Fetch notes documents (supports filtering by subject code, folder_id, year, semester, search, college)
 */
router.get('/', cacheRoute(60, ['notes'], 30), async (req: Request, res: Response) => {
  const { profile } = await getOptionalSession(req as AuthedRequest, res);
  const collegeParam = (req.query.college as string | undefined)?.trim();
  const targetCollege = (profile?.role === 'student' || profile?.role === 'organizer')
    ? (profile.college || DEFAULT_COLLEGE)
    : (collegeParam && collegeParam !== 'all' ? collegeParam : null);
  const { year, semester, search, code, folder_id } = req.query;

  // 1. Try Azure Database first if configured & healthy
  const conditions: string[] = ['is_active = true'];
  const params: any[] = [];
  let paramIdx = 1;

  if (code && typeof code === 'string' && code.trim()) {
    conditions.push(`code = $${paramIdx++}`);
    params.push(code.trim());
  }

  if (folder_id === 'root') {
    conditions.push(`folder_id IS NULL`);
  } else if (folder_id && typeof folder_id === 'string' && folder_id !== 'all') {
    conditions.push(`folder_id = $${paramIdx++}`);
    params.push(folder_id);
  }

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
    let filtered = azureNotes.map((n: any) => ({ ...n, college: n.college || DEFAULT_COLLEGE }));
    if (targetCollege && targetCollege !== 'all') {
      filtered = filtered.filter((n: any) => matchesCollege(n.college, targetCollege));
    }
    return res.json({ ok: true, notes: filtered, source: 'azure' });
  }

  // 2. Resilient Supabase fallback
  const supabase = createAnonClient();
  let query = supabase
    .from('notes')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (code && typeof code === 'string' && code.trim()) {
    query = query.eq('code', code.trim());
  }

  if (folder_id === 'root') {
    query = query.is('folder_id', null);
  } else if (folder_id && typeof folder_id === 'string' && folder_id !== 'all') {
    query = query.eq('folder_id', folder_id);
  }

  if (year && typeof year === 'string' && year !== 'all') {
    query = query.eq('year', year);
  }

  if (semester && typeof semester === 'string' && semester !== 'all') {
    query = query.eq('semester', semester);
  }

  if (search && typeof search === 'string' && search.trim()) {
    query = query.or(`title.ilike.%${search.trim()}%,code.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%,subject.ilike.%${search.trim()}%`);
  }

  let { data, error } = await query;

  if (error && (error.code === 'PGRST204' || error.message?.includes('folder_id') || error.message?.includes('schema cache'))) {
    console.warn('[Supabase] folder_id column not yet in Supabase schema cache. Retrying without folder filter.');
    let fallbackQuery = supabase
      .from('notes')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (code && typeof code === 'string' && code.trim()) {
      fallbackQuery = fallbackQuery.eq('code', code.trim());
    }
    if (year && typeof year === 'string' && year !== 'all') {
      fallbackQuery = fallbackQuery.eq('year', year);
    }
    if (semester && typeof semester === 'string' && semester !== 'all') {
      fallbackQuery = fallbackQuery.eq('semester', semester);
    }
    if (search && typeof search === 'string' && search.trim()) {
      fallbackQuery = fallbackQuery.or(`title.ilike.%${search.trim()}%,code.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%,subject.ilike.%${search.trim()}%`);
    }
    const fallback = await fallbackQuery;
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
      console.warn('[Supabase] public.notes table not yet created in database. Returning an empty notes list.');
      return res.json({ ok: true, notes: [], source: 'empty' });
    }
    console.error('Error fetching public notes:', error);
    return res.status(500).json({ ok: false, error: 'Failed to load notes' });
  }

  let resultNotes = (data || []).map((n: any) => ({
    ...n,
    college: (n as any).college || DEFAULT_COLLEGE,
  }));

  if (targetCollege && targetCollege !== 'all') {
    resultNotes = resultNotes.filter((n: any) => matchesCollege(n.college, targetCollege));
  }

  return res.json({ ok: true, notes: resultNotes, source: (resultNotes.length > 0) ? 'supabase' : 'empty' });
});

export { router as notesRouter };
