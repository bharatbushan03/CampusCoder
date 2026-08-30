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

const pdfUpload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF documents are allowed'));
    }
  },
});

function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

router.post('/pdf', pdfUpload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, error: 'No PDF file uploaded' });
  }

  try {
    const supabase = createAdminClient();
    const cleanOriginalName = req.file.originalname
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\.pdf$/i, '');
    const fileName = `notes/${Date.now()}-${cleanOriginalName}.pdf`;

    // Try uploading to 'documents' bucket or fallback to 'banners' if 'documents' not created
    let bucketName = 'documents';
    let { error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, req.file.buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'application/pdf',
      });

    if (error && error.message?.includes('Bucket not found')) {
      bucketName = 'banners';
      const fallbackUpload = await supabase.storage
        .from(bucketName)
        .upload(fileName, req.file.buffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'application/pdf',
        });
      error = fallbackUpload.error;
    }

    if (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
    return res.json({
      ok: true,
      url: data.publicUrl,
      fileName: req.file.originalname,
      fileSize: formatBytes(req.file.size),
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message || 'PDF upload failed' });
  }
});

export { router as uploadRouter };
