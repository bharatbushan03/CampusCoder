import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthedRequest } from '../middleware/auth';
import { createUserClient, getUserAccessToken } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  college: z.string().min(2, 'College name is required').max(150).optional(),
  branch: z.string().min(2, 'Branch is required').max(100).optional(),
  year: z.string().min(1, 'Year is required').optional(),
});

router.get('/', async (req: AuthedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ ok: false, error: 'Authentication required' });
  }

  const supabase = createUserClient(getUserAccessToken(req) || '');
  const [profileResult, registrationsResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', req.user.id).single(),
    supabase
      .from('registrations')
      .select('*, events(*)')
      .eq('email', req.user.email || '')
      .order('registered_at', { ascending: false }),
  ]);

  if (profileResult.error) {
    return res.status(500).json({ ok: false, error: 'Failed to load profile' });
  }

  return res.json({
    ok: true,
    profile: profileResult.data,
    registrations: registrationsResult.error ? [] : registrationsResult.data,
  });
});

router.put('/', async (req: Request, res: Response) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.issues[0].message });
  }

  const authedReq = req as AuthedRequest;
  if (!authedReq.user) {
    return res.status(401).json({ ok: false, error: 'Authentication required' });
  }

  const supabase = createUserClient(getUserAccessToken(authedReq) || '');
  const { error } = await supabase
    .from('profiles')
    .update(parsed.data)
    .eq('id', authedReq.user.id);

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to update profile' });
  }
  return res.json({ ok: true });
});

const regIdSchema = z.uuid('Invalid registration id');

router.delete('/registrations/:id', async (req: Request, res: Response) => {
  const parsed = regIdSchema.safeParse(req.params.id);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.issues[0].message });
  }

  const authedReq = req as AuthedRequest;
  if (!authedReq.user) {
    return res.status(401).json({ ok: false, error: 'Authentication required' });
  }

  const supabase = createUserClient(getUserAccessToken(authedReq) || '');
  const { error } = await supabase
    .from('registrations')
    .delete()
    .eq('id', parsed.data)
    .eq('email', authedReq.user.email || '');

  if (error) {
    return res.status(500).json({ ok: false, error: 'Failed to cancel registration' });
  }
  return res.json({ ok: true });
});

export { router as meRouter };
