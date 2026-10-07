import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import path from 'path';
import convert from 'heic-convert';
import { requireAuth, requireRole } from '../middleware/auth';
import { createAdminClient } from '../utils/supabase/admin';
import { isAzureStorageConfigured, uploadToAzureBlob } from '../lib/azureStorage';

const router = Router();

router.use(requireAuth, requireRole('admin', 'organizer'));

const ALLOWED_IMAGE_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/heic',
  'image/heic-sequence',
  'image/heif',
  'image/heif-sequence',
  'image/bmp',
  'image/tiff',
  'image/svg+xml',
  'application/octet-stream',
]);

const ALLOWED_IMAGE_EXTS = new Set([
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.heic', '.heif', '.bmp', '.tiff', '.tif', '.svg'
]);

function isAllowedImageFile(file: Express.Multer.File) {
  if (ALLOWED_IMAGE_MIMES.has(file.mimetype.toLowerCase())) return true;
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_IMAGE_EXTS.has(ext)) return true;
  return false;
}

async function processImageBuffer(file: Express.Multer.File): Promise<{ buffer: Buffer; mimetype: string; originalname: string }> {
  const isHeic = file.originalname.toLowerCase().endsWith('.heic') ||
                 file.originalname.toLowerCase().endsWith('.heif') ||
                 file.mimetype.toLowerCase() === 'image/heic' ||
                 file.mimetype.toLowerCase() === 'image/heif' ||
                 file.mimetype.toLowerCase() === 'image/heic-sequence' ||
                 file.mimetype.toLowerCase() === 'image/heif-sequence';

  if (isHeic) {
    try {
      const outputBuffer = await convert({
        buffer: file.buffer,
        format: 'JPEG',
        quality: 0.92,
      });
      const newName = file.originalname.replace(/\.(heic|heif)$/i, '.jpg');
      return {
        buffer: Buffer.from(outputBuffer),
        mimetype: 'image/jpeg',
        originalname: newName,
      };
    } catch (err: any) {
      console.warn('[Upload] HEIC conversion fallback error:', err.message);
    }
  }
  return {
    buffer: file.buffer,
    mimetype: file.mimetype,
    originalname: file.originalname,
  };
}

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (isAllowedImageFile(file)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPG, WEBP, GIF, AVIF, HEIC, HEIF, SVG, BMP, TIFF images are allowed'));
    }
  },
});

router.post('/banner', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, error: 'No file uploaded' });
  }

  const processed = await processImageBuffer(req.file);
  const ext = imageExt(processed.mimetype, processed.originalname);
  const fileName = `banners/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  // 1. Try Azure Blob Storage if configured
  if (isAzureStorageConfigured()) {
    try {
      const azureUrl = await uploadToAzureBlob('event-banners', fileName, processed.buffer, processed.mimetype);
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
      .upload(fileName, processed.buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: processed.mimetype,
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

function imageExt(mimetype: string, originalName?: string) {
  if (originalName) {
    const ext = path.extname(originalName).toLowerCase().replace('.', '');
    if (['heic', 'heif', 'avif', 'webp', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'bmp', 'tiff', 'tif'].includes(ext)) {
      return ext === 'jpeg' ? 'jpg' : ext === 'tif' ? 'tiff' : ext;
    }
  }
  const mime = mimetype.toLowerCase();
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
  if (mime === 'image/heic' || mime === 'image/heic-sequence') return 'heic';
  if (mime === 'image/heif' || mime === 'image/heif-sequence') return 'heif';
  if (mime === 'image/avif') return 'avif';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/gif') return 'gif';
  if (mime === 'image/svg+xml') return 'svg';
  if (mime === 'image/bmp') return 'bmp';
  if (mime === 'image/tiff') return 'tiff';
  const sub = mime.split('/')[1];
  return sub && sub !== 'octet-stream' ? sub : 'jpg';
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
    if (isAllowedImageFile(file)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPG, WEBP, GIF, AVIF, HEIC, HEIF, SVG, BMP, TIFF images are allowed'));
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

router.post('/photo', requireRole('admin', 'organizer'), photoUpload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, error: 'No image file uploaded' });
  }

  const processed = await processImageBuffer(req.file);
  const ext = imageExt(processed.mimetype, processed.originalname);
  const cleanName = safeBaseName(processed.originalname);
  const fileName = `event-photos/${Date.now()}-${cleanName}.${ext}`;

  // 1. Try Azure Blob Storage if configured
  if (isAzureStorageConfigured()) {
    try {
      const azureUrl = await uploadToAzureBlob('event-photos', fileName, processed.buffer, processed.mimetype);
      if (azureUrl) {
        return res.json({ ok: true, url: azureUrl, fileName: processed.originalname, provider: 'azure' });
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
      .upload(fileName, processed.buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: processed.mimetype,
      });

    if (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
    return res.json({ ok: true, url: data.publicUrl, fileName: processed.originalname, provider: 'supabase' });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message || 'Photo upload failed' });
  }
});

router.post('/photos', requireRole('admin', 'organizer'), photoUpload.array('files', 20), async (req: Request, res: Response) => {
  const rawFiles = req.files as Express.Multer.File[];
  if (!rawFiles || rawFiles.length === 0) {
    return res.status(400).json({ ok: false, error: 'No image files uploaded' });
  }

  const files: Array<{ buffer: Buffer; mimetype: string; originalname: string }> = [];
  for (const f of rawFiles) {
    files.push(await processImageBuffer(f));
  }
  const uploadedUrls: string[] = [];

  // If Azure Storage configured, try uploading batch to Azure
  if (isAzureStorageConfigured()) {
    try {
      const azureUrls: string[] = [];
      for (const file of files) {
        const ext = imageExt(file.mimetype, file.originalname);
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
      const ext = imageExt(file.mimetype, file.originalname);
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

router.post('/videos', requireRole('admin', 'organizer'), videoUpload.array('files', 5), async (req: Request, res: Response) => {
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

router.post('/zip', requireRole('admin', 'organizer'), zipUpload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, error: 'No ZIP file uploaded' });
  }

  const JSZip = (await import('jszip')).default;

  // --- 1. Extract the ZIP and classify entries as photos or videos ---
  let zip: InstanceType<typeof JSZip>;
  try {
    zip = await JSZip.loadAsync(req.file.buffer);
  } catch (parseErr: any) {
    return res.status(400).json({ ok: false, error: 'Invalid or corrupted ZIP archive: ' + (parseErr.message || '') });
  }

  const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.heic', '.heif', '.bmp', '.tiff', '.tif', '.svg']);
  const VIDEO_EXTS = new Set(['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.m4v']);

  type ExtractedFile = { name: string; ext: string; buffer: Buffer; type: 'photo' | 'video' };
  const extracted: ExtractedFile[] = [];

  const entries = Object.values(zip.files).filter(f => !f.dir);
  for (const entry of entries) {
    // Skip macOS resource fork files and hidden files
    const baseName = entry.name.split('/').pop() || '';
    if (baseName.startsWith('.') || baseName.startsWith('__MACOSX') || entry.name.includes('__MACOSX/')) continue;

    const ext = path.extname(baseName).toLowerCase();
    let fileType: 'photo' | 'video' | null = null;
    if (IMAGE_EXTS.has(ext)) fileType = 'photo';
    else if (VIDEO_EXTS.has(ext)) fileType = 'video';

    if (!fileType) continue; // skip non-media files

    try {
      const buf = await entry.async('nodebuffer');
      extracted.push({ name: baseName, ext, buffer: buf, type: fileType });
    } catch (readErr: any) {
      console.warn(`[Upload/ZIP] Could not read entry "${entry.name}":`, readErr.message);
    }
  }

  if (extracted.length === 0) {
    return res.status(400).json({
      ok: false,
      error: 'ZIP archive contains no supported image or video files. Supported: PNG, JPG, WEBP, GIF, AVIF, HEIC, MP4, WEBM, MOV, etc.',
    });
  }

  // --- 2. Upload each extracted file to blob storage ---
  const photoUrls: string[] = [];
  const videoUrls: string[] = [];
  const timestamp = Date.now();
  let uploadErrors = 0;

  for (let i = 0; i < extracted.length; i++) {
    const file = extracted[i];
    const cleanEntryName = safeBaseName(file.name);
    const fileExt = file.ext.replace('.', '');

    if (file.type === 'photo') {
      // Process HEIC/HEIF conversion if needed
      let uploadBuffer = file.buffer;
      let uploadMime = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;
      let uploadExt = fileExt;

      const isHeic = ['heic', 'heif'].includes(fileExt);
      if (isHeic) {
        try {
          const outputBuffer = await convert({
            buffer: file.buffer,
            format: 'JPEG',
            quality: 0.92,
          });
          uploadBuffer = Buffer.from(outputBuffer);
          uploadMime = 'image/jpeg';
          uploadExt = 'jpg';
        } catch (heicErr: any) {
          console.warn(`[Upload/ZIP] HEIC conversion failed for ${file.name}:`, heicErr.message);
        }
      }

      const blobName = `event-photos/${timestamp}-${i}-${cleanEntryName}.${uploadExt}`;

      if (isAzureStorageConfigured()) {
        try {
          const azUrl = await uploadToAzureBlob('event-photos', blobName, uploadBuffer, uploadMime);
          if (azUrl) { photoUrls.push(azUrl); continue; }
        } catch (azErr: any) {
          console.warn(`[Upload/ZIP] Azure photo upload failed for ${file.name}:`, azErr.message);
        }
      }

      // Supabase fallback
      try {
        const supabase = createAdminClient();
        const { error } = await supabase.storage.from('banners').upload(blobName, uploadBuffer, {
          cacheControl: '3600', upsert: false, contentType: uploadMime,
        });
        if (!error) {
          const { data } = supabase.storage.from('banners').getPublicUrl(blobName);
          photoUrls.push(data.publicUrl);
        } else {
          uploadErrors++;
        }
      } catch { uploadErrors++; }
    } else {
      // Video
      const mimeMap: Record<string, string> = {
        mp4: 'video/mp4', webm: 'video/webm', ogg: 'video/ogg',
        mov: 'video/quicktime', avi: 'video/x-msvideo', mkv: 'video/x-matroska', m4v: 'video/mp4',
      };
      const videoMime = mimeMap[fileExt] || 'video/mp4';
      const blobName = `event-videos/${timestamp}-${i}-${cleanEntryName}.${fileExt}`;

      if (isAzureStorageConfigured()) {
        try {
          const azUrl = await uploadToAzureBlob('event-videos', blobName, file.buffer, videoMime);
          if (azUrl) { videoUrls.push(azUrl); continue; }
        } catch (azErr: any) {
          console.warn(`[Upload/ZIP] Azure video upload failed for ${file.name}:`, azErr.message);
        }
      }

      // Supabase fallback
      try {
        const supabase = createAdminClient();
        const { error } = await supabase.storage.from('banners').upload(blobName, file.buffer, {
          cacheControl: '3600', upsert: false, contentType: videoMime,
        });
        if (!error) {
          const { data } = supabase.storage.from('banners').getPublicUrl(blobName);
          videoUrls.push(data.publicUrl);
        } else {
          uploadErrors++;
        }
      } catch { uploadErrors++; }
    }
  }

  // --- 3. Also store the raw ZIP for download purposes ---
  let zipUrl = '';
  const zipCleanName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const zipFileName = `event-zips/${timestamp}-${zipCleanName.toLowerCase().endsWith('.zip') ? zipCleanName : `${zipCleanName}.zip`}`;

  if (isAzureStorageConfigured()) {
    try {
      const azureUrl = await uploadToAzureBlob('event-zips', zipFileName, req.file.buffer, 'application/zip');
      if (azureUrl) zipUrl = azureUrl;
    } catch (azErr: any) {
      console.warn('[Upload] Azure ZIP archive upload failed:', azErr.message);
    }
  }

  if (!zipUrl) {
    try {
      const supabase = createAdminClient();
      const { error } = await supabase.storage.from('banners').upload(zipFileName, req.file.buffer, {
        cacheControl: '3600', upsert: false, contentType: 'application/zip',
      });
      if (!error) {
        const { data } = supabase.storage.from('banners').getPublicUrl(zipFileName);
        zipUrl = data.publicUrl;
      }
    } catch {}
  }

  return res.json({
    ok: true,
    url: zipUrl,
    photo_urls: photoUrls,
    video_urls: videoUrls,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    photoCount: photoUrls.length,
    videoCount: videoUrls.length,
    uploadErrors,
    provider: isAzureStorageConfigured() ? 'azure' : 'supabase',
  });
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
