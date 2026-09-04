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

const photoUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per photo
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPG, WEBP, GIF, and AVIF images are allowed'));
    }
  },
});

router.post('/photo', photoUpload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, error: 'No image file uploaded' });
  }

  try {
    const supabase = createAdminClient();
    const ext = req.file.mimetype.split('/')[1] || 'jpg';
    const cleanName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `event-photos/${Date.now()}-${cleanName}.${ext}`;

    const bucketName = 'banners';
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, req.file.buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: req.file.mimetype,
      });

    if (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
    return res.json({ ok: true, url: data.publicUrl, fileName: req.file.originalname });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message || 'Photo upload failed' });
  }
});

router.post('/photos', photoUpload.array('files', 20), async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    return res.status(400).json({ ok: false, error: 'No image files uploaded' });
  }

  try {
    const supabase = createAdminClient();
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const ext = file.mimetype.split('/')[1] || 'jpg';
      const cleanName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `event-photos/${Date.now()}-${cleanName}.${ext}`;

      const { error } = await supabase.storage
        .from('banners')
        .upload(fileName, file.buffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.mimetype,
        });

      if (!error) {
        const { data } = supabase.storage.from('banners').getPublicUrl(fileName);
        uploadedUrls.push(data.publicUrl);
      }
    }

    return res.json({ ok: true, urls: uploadedUrls });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message || 'Photos batch upload failed' });
  }
});

const zipUpload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB for ZIP archive
  fileFilter: (_req, file, cb) => {
    const isZip =
      file.mimetype === 'application/zip' ||
      file.mimetype === 'application/x-zip-compressed' ||
      file.mimetype === 'application/octet-stream' ||
      file.originalname.toLowerCase().endsWith('.zip');
    if (isZip) {
      cb(null, true);
    } else {
      cb(new Error('Only .ZIP archive files are allowed'));
    }
  },
});

router.post('/zip', zipUpload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, error: 'No ZIP file uploaded' });
  }

  try {
    const supabase = createAdminClient();
    const cleanName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `event-zips/${Date.now()}-${cleanName.toLowerCase().endsWith('.zip') ? cleanName : `${cleanName}.zip`}`;

    const { error } = await supabase.storage
      .from('banners')
      .upload(fileName, req.file.buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'application/zip',
      });

    if (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }

    const { data } = supabase.storage.from('banners').getPublicUrl(fileName);
    return res.json({
      ok: true,
      url: data.publicUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message || 'ZIP upload failed' });
  }
});

export { router as uploadRouter };
