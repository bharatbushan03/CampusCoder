import { Router, type Request, type Response } from 'express';

const router = Router();

export interface DriveMediaItem {
  id: string;
  name: string;
  mimeType: string;
  mediaType: 'photo' | 'video' | 'other';
  thumbnailUrl: string;
  viewUrl: string;
  streamUrl: string;
  downloadUrl: string;
  size?: string;
}

/**
 * Parses a Google Drive URL to extract the ID and whether it represents a folder or file.
 */
export function extractDriveInfo(url: string): { id: string | null; isFolder: boolean } {
  if (!url) return { id: null, isFolder: false };

  const trimmed = url.trim();

  // 1. Check folder links
  const folderMatch = trimmed.match(/\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) {
    return { id: folderMatch[1], isFolder: true };
  }

  // 2. Check file links
  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) {
    return { id: fileMatch[1], isFolder: false };
  }

  // 3. Check open?id= or uc?id=
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) {
    const isFolderParam = trimmed.includes('folders') || trimmed.includes('folder');
    return { id: idParamMatch[1], isFolder: isFolderParam };
  }

  // 4. Raw alphanumeric ID (approx 20-50 chars)
  if (/^[a-zA-Z0-9_-]{20,50}$/.test(trimmed)) {
    return { id: trimmed, isFolder: false };
  }

  return { id: null, isFolder: false };
}

/**
 * GET /api/drive/contents
 *
 * Ephemerally resolves photos & videos from a Google Drive URL on-the-fly.
 * Media is NOT stored in Supabase; only streamed directly from Google's endpoints.
 */
router.get('/contents', async (req: Request, res: Response) => {
  const urlParam = (req.query.url as string) || (req.query.id as string) || '';
  if (!urlParam) {
    return res.status(400).json({ ok: false, error: 'Missing url or id parameter' });
  }

  const { id, isFolder } = extractDriveInfo(urlParam);
  if (!id) {
    return res.status(400).json({
      ok: false,
      error: 'Invalid Google Drive link or ID provided',
    });
  }

  // Case A: Single File Link
  if (!isFolder) {
    const singleItem: DriveMediaItem = {
      id,
      name: 'Drive Media Item',
      mimeType: 'image/jpeg',
      mediaType: 'photo',
      thumbnailUrl: `https://drive.google.com/thumbnail?id=${id}&sz=w600`,
      viewUrl: `https://drive.google.com/thumbnail?id=${id}&sz=w1920`,
      streamUrl: `https://drive.google.com/file/d/${id}/preview`,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${id}`,
    };

    return res.json({
      ok: true,
      isFolder: false,
      hasApiKey: false,
      count: 1,
      items: [singleItem],
      embedFolderUrl: null,
    });
  }

  // Case B: Folder Link
  const embedFolderUrl = `https://drive.google.com/embeddedfolderview?id=${id}#grid`;
  return res.json({
    ok: true,
    isFolder: true,
    folderId: id,
    hasApiKey: false,
    count: 0,
    items: [],
    embedFolderUrl,
    message: 'Using the embedded Google Drive viewer. No API key is required.',
  });
});

export { router as driveRouter };
