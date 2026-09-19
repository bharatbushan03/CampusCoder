import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import path from 'path';
import { requireAuth, requireRole } from '../middleware/auth';
import { createAdminClient } from '../utils/supabase/admin';
import { isAzureStorageConfigured, uploadToAzureBlob } from '../lib/azureStorage';

const router = Router();

router.use(requireAuth, requireRole('admin', 'organizer'));

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
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

  const ext = req.file.mimetype.split('/')[1] || 'png';
  const fileName = `banners/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  // 1. Try Azure Blob Storage if configured
  if (isAzureStorageConfigured()) {
    try {
      const azureUrl = await uploadToAzureBlob('event-banners', fileName, req.file.buffer, req.file.mimetype);
      if (azureUrl) {
        return res.json({ ok: true, url: azureUrl, provider: 'azure' });
      }
    } catch (azErr: any) {
      console.warn('[Upload] Azure Banner upload failed, falling back to Supabase:', azErr.message);
    }
  }

  // 2. Supabase Storage fallback
  try {
    const supabase = createAdminClient();
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
    return res.json({ ok: true, url: data.publicUrl, provider: 'supabase' });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message || 'Upload failed' });
  }
});

const DISALLOWED_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.ps1', '.msi', '.dll', '.vbs', '.com', '.scr', '.pif'
]);

const documentUpload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB (allowing up to 48MB files comfortably with headers)
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (DISALLOWED_EXTENSIONS.has(ext)) {
      cb(new Error(`File extension "${ext}" is not allowed for security reasons`));
    } else {
      cb(null, true);
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

function safeBaseName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.[a-z0-9]+$/i, '');
}

function imageExt(mimetype: string) {
  if (mimetype === 'image/jpeg') return 'jpg';
  if (mimetype === 'image/heic') return 'heic';
  if (mimetype === 'image/heif') return 'heif';
  return mimetype.split('/')[1] || 'jpg';
}

const handleDocumentUpload = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, error: 'No document file uploaded' });
  }

  const rawExt = path.extname(req.file.originalname) || '';
  const cleanExt = rawExt.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase();
  const baseName = path.basename(req.file.originalname, rawExt)
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 100);

  const finalExt = cleanExt || (req.file.mimetype.includes('pdf') ? '.pdf' : '');
  const fileName = `notes/${Date.now()}-${baseName}${finalExt}`;
  const contentType = req.file.mimetype || 'application/octet-stream';

  // 1. Try Azure Blob Storage if configured
  if (isAzureStorageConfigured()) {
    try {
      const azureUrl = await uploadToAzureBlob('documents', fileName, req.file.buffer, contentType);
      if (azureUrl) {
        return res.json({
          ok: true,
          url: azureUrl,
          fileName: req.file.originalname,
          fileSize: formatBytes(req.file.size),
          contentType,
          provider: 'azure',
        });
      }
    } catch (azErr: any) {
      console.warn('[Upload] Azure Document upload failed, falling back to Supabase:', azErr.message);
    }
  }

  // 2. Supabase Storage fallback
  try {
    const supabase = createAdminClient();
    let bucketName = 'documents';
    let { error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, req.file.buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType,
      });

    if (error && error.message?.includes('Bucket not found')) {
      bucketName = 'banners';
      const fallbackUpload = await supabase.storage
        .from(bucketName)
        .upload(fileName, req.file.buffer, {
          cacheControl: '3600',
          upsert: false,
          contentType,
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
      contentType,
      provider: 'supabase',
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message || 'Document upload failed' });
  }
};

router.post('/pdf', documentUpload.single('file'), handleDocumentUpload);
router.post('/document', documentUpload.single('file'), handleDocumentUpload);

const photoUpload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per photo
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif', 'image/heic', 'image/heif'];
    if (allowed.includes(file.mimetype) || file.originalname.toLowerCase().endsWith('.heic') || file.originalname.toLowerCase().endsWith('.heif')) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPG, WEBP, GIF, AVIF, HEIC, and HEIF images are allowed'));
    }
  },
});

const videoUpload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // Up to 500MB video files
  fileFilter: (_req, file, cb) => {
    const allowed = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only MP4, WEBM, OGG, and MOV videos are allowed'));
    }
  },
});

router.post('/photo', requireRole('admin'), photoUpload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, error: 'No image file uploaded' });
  }

  const ext = imageExt(req.file.mimetype);
  const cleanName = safeBaseName(req.file.originalname);
  const fileName = `event-photos/${Date.now()}-${cleanName}.${ext}`;

  // 1. Try Azure Blob Storage if configured
  if (isAzureStorageConfigured()) {
    try {
      const azureUrl = await uploadToAzureBlob('event-photos', fileName, req.file.buffer, req.file.mimetype);
      if (azureUrl) {
        return res.json({ ok: true, url: azureUrl, fileName: req.file.originalname, provider: 'azure' });
      }
    } catch (azErr: any) {
      console.warn('[Upload] Azure Photo upload failed, falling back to Supabase:', azErr.message);
    }
  }

  // 2. Supabase Storage fallback
  try {
    const supabase = createAdminClient();
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
    return res.json({ ok: true, url: data.publicUrl, fileName: req.file.originalname, provider: 'supabase' });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message || 'Photo upload failed' });
  }
});

router.post('/photos', requireRole('admin'), photoUpload.array('files', 20), async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    return res.status(400).json({ ok: false, error: 'No image files uploaded' });
  }

  const uploadedUrls: string[] = [];

  // If Azure Storage configured, try uploading batch to Azure
  if (isAzureStorageConfigured()) {
    try {
      const azureUrls: string[] = [];
      for (const file of files) {
        const ext = imageExt(file.mimetype);
        const cleanName = safeBaseName(file.originalname);
        const fileName = `event-photos/${Date.now()}-${cleanName}.${ext}`;
        const azUrl = await uploadToAzureBlob('event-photos', fileName, file.buffer, file.mimetype);
        if (!azUrl) {
          throw new Error(`Azure upload failed for ${file.originalname}`);
        }
        azureUrls.push(azUrl);
      }
      return res.json({ ok: true, urls: azureUrls, provider: 'azure' });
    } catch (azErr: any) {
      console.warn('[Upload] Azure batch photos upload failed, falling back to Supabase:', azErr.message);
    }
  }

  // Supabase Storage fallback
  try {
    const supabase = createAdminClient();
    for (const file of files) {
      const ext = imageExt(file.mimetype);
      const cleanName = safeBaseName(file.originalname);
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

    return res.json({ ok: true, urls: uploadedUrls, provider: 'supabase' });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message || 'Photos batch upload failed' });
  }
});

router.post('/videos', requireRole('admin'), videoUpload.array('files', 5), async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    return res.status(400).json({ ok: false, error: 'No video files uploaded' });
  }

  const uploadedUrls: string[] = [];

  if (isAzureStorageConfigured()) {
    try {
      const azureUrls: string[] = [];
      for (const file of files) {
        const ext = file.mimetype === 'video/quicktime' ? 'mov' : (file.mimetype.split('/')[1] || 'mp4');
        const cleanName = safeBaseName(file.originalname);
        const fileName = `event-videos/${Date.now()}-${cleanName}.${ext}`;
        const azUrl = await uploadToAzureBlob('event-videos', fileName, file.buffer, file.mimetype);
        if (!azUrl) {
          throw new Error(`Azure upload failed for ${file.originalname}`);
        }
        azureUrls.push(azUrl);
      }
      return res.json({ ok: true, urls: azureUrls, provider: 'azure' });
    } catch (azErr: any) {
      console.warn('[Upload] Azure videos upload failed, falling back to Supabase:', azErr.message);
    }
  }

  try {
    const supabase = createAdminClient();
    for (const file of files) {
      const ext = file.mimetype === 'video/quicktime' ? 'mov' : (file.mimetype.split('/')[1] || 'mp4');
      const cleanName = safeBaseName(file.originalname);
      const fileName = `event-videos/${Date.now()}-${cleanName}.${ext}`;

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

    return res.json({ ok: true, urls: uploadedUrls, provider: 'supabase' });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message || 'Videos upload failed' });
  }
});

const zipUpload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB for ZIP archive (photos and videos)
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

router.post('/zip', requireRole('admin'), zipUpload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, error: 'No ZIP file uploaded' });
  }

  const cleanName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = `event-zips/${Date.now()}-${cleanName.toLowerCase().endsWith('.zip') ? cleanName : `${cleanName}.zip`}`;

  // 1. Try Azure Blob Storage if configured
  if (isAzureStorageConfigured()) {
    try {
      const azureUrl = await uploadToAzureBlob('event-zips', fileName, req.file.buffer, 'application/zip');
      if (azureUrl) {
        return res.json({
          ok: true,
          url: azureUrl,
          fileName: req.file.originalname,
          fileSize: req.file.size,
          provider: 'azure',
        });
      }
    } catch (azErr: any) {
      console.warn('[Upload] Azure ZIP upload failed, falling back to Supabase:', azErr.message);
    }
  }

  // 2. Supabase Storage fallback
  try {
    const supabase = createAdminClient();
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
      provider: 'supabase',
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message || 'ZIP upload failed' });
  }
});

router.use((err: any, _req: Request, res: Response, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ ok: false, error: 'File size exceeds maximum allowed limit.' });
    }
    return res.status(400).json({ ok: false, error: err.message });
  }
  if (err) {
    return res.status(400).json({ ok: false, error: err.message || 'File upload failed' });
  }
  next();
});

export { router as uploadRouter };
