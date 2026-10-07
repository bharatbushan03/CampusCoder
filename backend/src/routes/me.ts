import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import convert from 'heic-convert';
import { requireAuth, type AuthedRequest } from '../middleware/auth';
import { createUserClient, getUserAccessToken } from '../middleware/auth';
import { createAdminClient } from '../utils/supabase/admin';
import { isAzureStorageConfigured, uploadToAzureBlob } from '../lib/azureStorage';

const router = Router();

router.use(requireAuth);

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  college: z.string().min(2, 'College name is required').max(150).optional(),
  branch: z.string().min(2, 'Branch is required').max(100).optional(),
  year: z.string().min(1, 'Year is required').optional(),
  avatar_url: z.string().url().or(z.literal('')).nullable().optional(),
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

  // Build update object — only include avatar_url if it was explicitly provided
  const updateData: Record<string, any> = { ...parsed.data };

  const { error } = await (supabase
    .from('profiles') as any)
    .update(updateData)
    .eq('id', authedReq.user.id);

  if (error) {
    // Graceful fallback if avatar_url column doesn't exist yet
    if (error.code === '42703' || error.message?.includes('avatar_url')) {
      const fallback = { ...updateData };
      delete fallback.avatar_url;
      const { error: fallbackErr } = await (supabase
        .from('profiles') as any)
        .update(fallback)
        .eq('id', authedReq.user.id);
      if (fallbackErr) {
        return res.status(500).json({ ok: false, error: 'Failed to update profile' });
      }
      return res.json({ ok: true });
    }
    return res.status(500).json({ ok: false, error: 'Failed to update profile' });
  }
  return res.json({ ok: true });
});

// ---------- Avatar Upload ----------

const ALLOWED_AVATAR_MIMES = new Set([
  'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif',
  'image/avif', 'image/heic', 'image/heif', 'image/bmp',
  'application/octet-stream',
]);

const ALLOWED_AVATAR_EXTS = new Set([
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.heic', '.heif', '.bmp',
]);

function isAllowedAvatarFile(file: Express.Multer.File) {
  if (ALLOWED_AVATAR_MIMES.has(file.mimetype.toLowerCase())) return true;
  const ext = path.extname(file.originalname).toLowerCase();
  return ALLOWED_AVATAR_EXTS.has(ext);
}

function avatarExt(mimetype: string, originalName?: string) {
  if (originalName) {
    const ext = path.extname(originalName).toLowerCase().replace('.', '');
    if (['avif', 'webp', 'png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(ext)) {
      return ext === 'jpeg' ? 'jpg' : ext;
    }
  }
  const mime = mimetype.toLowerCase();
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  if (mime === 'image/avif') return 'avif';
  if (mime === 'image/bmp') return 'bmp';
  return 'jpg';
}

const avatarStorage = multer.memoryStorage();
const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max for avatars
  fileFilter: (_req, file, cb) => {
    if (isAllowedAvatarFile(file)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPG, WEBP, GIF, AVIF, HEIC, HEIF, BMP images are allowed for avatars'));
    }
  },
});

router.post('/avatar', avatarUpload.single('file'), async (req: Request, res: Response) => {
  const authedReq = req as AuthedRequest;
  if (!authedReq.user) {
    return res.status(401).json({ ok: false, error: 'Authentication required' });
  }

  if (!req.file) {
    return res.status(400).json({ ok: false, error: 'No image file uploaded' });
  }

  // Process HEIC/HEIF conversion
  let buffer = req.file.buffer;
  let mimetype = req.file.mimetype;
  let originalname = req.file.originalname;

  const isHeic = /\.(heic|heif)$/i.test(originalname) ||
    mimetype.toLowerCase() === 'image/heic' ||
    mimetype.toLowerCase() === 'image/heif';

  if (isHeic) {
    try {
      const outputBuffer = await convert({
        buffer: buffer,
        format: 'JPEG',
        quality: 0.92,
      });
      buffer = Buffer.from(outputBuffer);
      mimetype = 'image/jpeg';
      originalname = originalname.replace(/\.(heic|heif)$/i, '.jpg');
    } catch (heicErr: any) {
      console.warn('[Avatar] HEIC conversion fallback:', heicErr.message);
    }
  }

  const ext = avatarExt(mimetype, originalname);
  const userId = authedReq.user.id;
  const fileName = `avatars/${userId}-${Date.now()}.${ext}`;

  let avatarUrl = '';

  // 1. Try Azure Blob Storage if configured
  if (isAzureStorageConfigured()) {
    try {
      const azUrl = await uploadToAzureBlob('avatars', fileName, buffer, mimetype);
      if (azUrl) avatarUrl = azUrl;
    } catch (azErr: any) {
      console.warn('[Avatar] Azure upload failed, falling back to Supabase:', azErr.message);
    }
  }

  // 2. Supabase Storage fallback
  if (!avatarUrl) {
    try {
      const supabaseAdmin = createAdminClient();
      const { error } = await supabaseAdmin.storage
        .from('banners')
        .upload(fileName, buffer, {
          cacheControl: '3600',
          upsert: true,
          contentType: mimetype,
        });

      if (error) {
        return res.status(500).json({ ok: false, error: error.message });
      }

      const { data } = supabaseAdmin.storage.from('banners').getPublicUrl(fileName);
      avatarUrl = data.publicUrl;
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err.message || 'Avatar upload failed' });
    }
  }

  // 3. Update profiles table with the avatar URL
  try {
    const supabaseAdmin = createAdminClient();
    const { error: updateErr } = await (supabaseAdmin
      .from('profiles') as any)
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);

    if (updateErr) {
      // If avatar_url column doesn't exist yet, still return the URL
      console.warn('[Avatar] Could not save avatar_url to profile (column may not exist yet):', updateErr.message);
    }
  } catch (dbErr: any) {
    console.warn('[Avatar] DB update warning:', dbErr.message);
  }

  return res.json({
    ok: true,
    url: avatarUrl,
    provider: isAzureStorageConfigured() ? 'azure' : 'supabase',
  });
});

// Multer error handler for avatar upload
router.use((err: any, _req: Request, res: Response, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ ok: false, error: 'Avatar image must be under 5MB.' });
    }
    return res.status(400).json({ ok: false, error: err.message });
  }
  if (err) {
    return res.status(400).json({ ok: false, error: err.message || 'Avatar upload failed' });
  }
  next();
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
