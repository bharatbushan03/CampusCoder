/**
 * Google Drive Media Utilities & Ephemeral Client-Side Session Manager
 *
 * Ephemerally loads and streams photos & videos from Google Drive folders and files.
 * NOTHING is stored in Supabase: media is dynamically fetched on demand and fully
 * destroyed and purged from memory as soon as the student closes the viewer.
 */

const CACHE_NAME = 'campuscoder-drive-photos-v1';

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

export interface DriveContentsResponse {
  ok: boolean;
  isFolder: boolean;
  folderId?: string;
  hasApiKey: boolean;
  count: number;
  items: DriveMediaItem[];
  embedFolderUrl: string | null;
  message?: string;
  apiError?: string;
  fromCache?: boolean;
}

/**
 * Ephemeral Session Tracker
 * Tracks all temporary object URLs and memory buffers created during a user's viewing session.
 * Calling cleanup() revokes all object URLs and clears memory immediately.
 */
class EphemeralSessionTracker {
  private activeBlobUrls = new Set<string>();

  public registerBlob(blobUrl: string): string {
    if (blobUrl && blobUrl.startsWith('blob:')) {
      this.activeBlobUrls.add(blobUrl);
    }
    return blobUrl;
  }

  public createBlobUrl(blob: Blob): string {
    const url = URL.createObjectURL(blob);
    this.activeBlobUrls.add(url);
    return url;
  }

  public revoke(url: string): void {
    if (this.activeBlobUrls.has(url)) {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        console.warn('Error revoking blob URL:', e);
      }
      this.activeBlobUrls.delete(url);
    }
  }

  public cleanup(): void {
    this.activeBlobUrls.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        console.warn('Error during session cleanup:', e);
      }
    });
    this.activeBlobUrls.clear();
  }

  public getActiveCount(): number {
    return this.activeBlobUrls.size;
  }
}

export const ephemeralSession = new EphemeralSessionTracker();

// In-memory fallback cache if Cache API is restricted (e.g. Incognito mode)
const memoryBlobCache = new Map<string, string>();

/**
 * Extracts Google Drive file or folder ID from various sharing formats:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 * - https://drive.google.com/drive/folders/FOLDER_ID
 * - https://drive.google.com/drive/u/0/folders/FOLDER_ID
 */
export function extractDriveId(url: string): { id: string | null; isFolder: boolean } {
  if (!url) return { id: null, isFolder: false };

  const trimmed = url.trim();

  // Folder link check
  const folderMatch = trimmed.match(/\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) {
    return { id: folderMatch[1], isFolder: true };
  }

  // File link formats
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return { id: fileDMatch[1], isFolder: false };
  }

  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) {
    const isFolder = trimmed.includes('folders') || trimmed.includes('folder');
    return { id: idParamMatch[1], isFolder };
  }

  // Raw ID check (20+ chars)
  if (/^[a-zA-Z0-9_-]{20,50}$/.test(trimmed)) {
    return { id: trimmed, isFolder: false };
  }

  return { id: null, isFolder: false };
}

/**
 * Converts a Google Drive file link or ID into a high-res streamable image URL.
 */
export function formatDriveImageUrl(urlOrId: string): string {
  const trimmed = urlOrId.trim();
  if (!trimmed) return '';

  if (trimmed.includes('drive.google.com') || trimmed.includes('googleusercontent.com')) {
    const { id, isFolder } = extractDriveId(trimmed);
    if (id && !isFolder) {
      return `https://drive.google.com/thumbnail?id=${id}&sz=w1600`;
    }
  }

  // If already a raw file ID
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
    return `https://drive.google.com/thumbnail?id=${trimmed}&sz=w1600`;
  }

  return trimmed;
}

/**
 * Formats a Google Drive link or ID into an embedded video preview stream URL.
 */
export function formatDriveVideoPreviewUrl(urlOrId: string): string {
  const trimmed = urlOrId.trim();
  if (!trimmed) return '';

  const { id } = extractDriveId(trimmed);
  if (id) {
    return `https://drive.google.com/file/d/${id}/preview`;
  }
  return trimmed;
}

/**
 * Ephemerally resolves photos & videos from a Google Drive folder or file on demand.
 * Media items are NOT stored in Supabase.
 */
export async function fetchDriveContents(urlOrId: string): Promise<DriveContentsResponse> {
  const trimmed = (urlOrId || '').trim();
  if (!trimmed) {
    return {
      ok: false,
      isFolder: false,
      hasApiKey: false,
      count: 0,
      items: [],
      embedFolderUrl: null,
      message: 'No Google Drive URL provided',
    };
  }

  try {
    const response = await fetch(`/api/drive/contents?url=${encodeURIComponent(trimmed)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch Drive contents (${response.status})`);
    }
    const data = await response.json();
    return data as DriveContentsResponse;
  } catch (err: any) {
    console.warn('Error fetching Drive contents via API, using fallback:', err);
    const { id, isFolder } = extractDriveId(trimmed);

    if (id && isFolder) {
      return {
        ok: true,
        isFolder: true,
        folderId: id,
        hasApiKey: false,
        count: 0,
        items: [],
        embedFolderUrl: `https://drive.google.com/embeddedfolderview?id=${id}#grid`,
        message: 'Using embedded Google Drive viewer fallback.',
      };
    }

    if (id && !isFolder) {
      const singleItem: DriveMediaItem = {
        id,
        name: 'Event Media',
        mimeType: 'image/jpeg',
        mediaType: 'photo',
        thumbnailUrl: `https://drive.google.com/thumbnail?id=${id}&sz=w600`,
        viewUrl: `https://drive.google.com/thumbnail?id=${id}&sz=w1920`,
        streamUrl: `https://drive.google.com/file/d/${id}/preview`,
        downloadUrl: `https://drive.google.com/uc?export=download&id=${id}`,
      };
      return {
        ok: true,
        isFolder: false,
        hasApiKey: false,
        count: 1,
        items: [singleItem],
        embedFolderUrl: null,
      };
    }

    return {
      ok: false,
      isFolder: false,
      hasApiKey: false,
      count: 0,
      items: [],
      embedFolderUrl: null,
      message: err.message || 'Failed to parse Google Drive link',
    };
  }
}

/**
 * Loads a single photo into memory and registers the object URL with the ephemeral session.
 */
export async function loadAndCachePhoto(
  url: string,
  onCacheHit?: () => void
): Promise<string> {
  const targetUrl = formatDriveImageUrl(url);

  // Check in-memory cache first
  if (memoryBlobCache.has(targetUrl)) {
    onCacheHit?.();
    return memoryBlobCache.get(targetUrl)!;
  }

  // Check browser Cache Storage API
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cache = await window.caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(targetUrl);

      if (cachedResponse) {
        const blob = await cachedResponse.blob();
        const blobUrl = ephemeralSession.createBlobUrl(blob);
        memoryBlobCache.set(targetUrl, blobUrl);
        onCacheHit?.();
        return blobUrl;
      }

      // Fetch from network and store in cache
      const response = await fetch(targetUrl, { mode: 'cors' });
      if (response.ok) {
        await cache.put(targetUrl, response.clone());
        const blob = await response.blob();
        const blobUrl = ephemeralSession.createBlobUrl(blob);
        memoryBlobCache.set(targetUrl, blobUrl);
        return blobUrl;
      }
    } catch (cacheErr) {
      console.warn('Cache storage lookup or save bypassed:', cacheErr);
    }
  }

  // Fallback: return direct targetUrl if Cache API fails or CORS restricts fetch
  return targetUrl;
}

/**
 * Batch loads and caches an array of photos with real-time progress updates.
 */
export async function loadAndCacheAllPhotos(
  urls: string[],
  onProgress?: (progressPercent: number, currentItem: number, total: number) => void
): Promise<{ cachedUrls: string[]; fromCacheCount: number }> {
  if (!urls || urls.length === 0) {
    return { cachedUrls: [], fromCacheCount: 0 };
  }

  let fromCacheCount = 0;
  const cachedUrls: string[] = [];

  for (let i = 0; i < urls.length; i++) {
    const rawUrl = urls[i];
    try {
      const cachedUrl = await loadAndCachePhoto(rawUrl, () => {
        fromCacheCount++;
      });
      cachedUrls.push(cachedUrl);
    } catch (err) {
      console.warn(`Failed to cache photo ${i + 1}:`, err);
      cachedUrls.push(formatDriveImageUrl(rawUrl));
    }

    const percent = Math.round(((i + 1) / urls.length) * 100);
    onProgress?.(percent, i + 1, urls.length);
  }

  return { cachedUrls, fromCacheCount };
}

/**
 * Clears the drive photos ephemeral cache completely and revokes all active blob URLs.
 * Guarantees that zero media persists when the user closes the viewer.
 */
export async function clearDrivePhotosCache(): Promise<void> {
  // 1. Revoke all active ephemeral blob URLs
  ephemeralSession.cleanup();

  // 2. Revoke any memory blob cache references
  memoryBlobCache.forEach((blobUrl) => {
    if (blobUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(blobUrl);
      } catch {
        // ignore
      }
    }
  });
  memoryBlobCache.clear();

  // 3. Clear Cache Storage API
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      await window.caches.delete(CACHE_NAME);
    } catch (err) {
      console.warn('Error clearing drive cache:', err);
    }
  }
}
