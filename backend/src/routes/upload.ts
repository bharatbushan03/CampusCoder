import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../middleware/auth';
import { createAdminClient } from '../utils/supabase/admin';

const router = Router();

router.use(requireAuth, requireRole('admin', 'organizer'));

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPG, WEBP and GIF images are allowed'));
    }
  },
});

router.post('/banner', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, error: 'No file uploaded' });
  }

  try {
    const supabase = createAdminClient();
    const ext = req.file.mimetype.split('/')[1] || 'png';
    const fileName = `banners/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage
      .from('banners')
      .upload(fileName, req.file.buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: req.file.mimetype,
      });

    if (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }

    const { data } = supabase.storage.from('banners').getPublicUrl(fileName);
    return res.json({ ok: true, url: data.publicUrl });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message || 'Upload failed' });
  }
});

export { router as uploadRouter };
