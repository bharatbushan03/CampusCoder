/**
 * Helpers for admin file uploads.
 *
 * Small uploads go through the Next.js `/api` proxy (same-origin, cookie auth).
 * Large uploads (ZIP archives, videos) must bypass the proxy, which cannot buffer
 * multi-hundred-MB bodies. When `NEXT_PUBLIC_BACKEND_URL` is set, they are sent
 * directly to the backend with a short-lived upload token issued by the backend.
 */

const DIRECT_BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || '').replace(/\/$/, '');

export const LEGACY_LOCAL_BACKEND = process.env.NEXT_PUBLIC_SITE_URL ? '' : 'http://localhost:4000';

export interface UploadTarget {
  url: string;
  headers: Record<string, string>;
}

export interface UploadResponse {
  ok: boolean;
  error?: string;
  [key: string]: unknown;
}

/**
 * Parse a JSON API response defensively. Proxies and gateways return plain-text
 * bodies ("Internal Server Error", "Request Entity Too Large") on failure.
 */
export async function parseUploadResponse(res: Response): Promise<UploadResponse> {
  const text = await res.text();
  try {
    return JSON.parse(text) as UploadResponse;
  } catch {
    const snippet = text.trim().slice(0, 120);
    if (res.status === 413) {
      return { ok: false, error: 'The file is too large for the server to accept.' };
    }
    return {
      ok: false,
      error: `Server returned ${res.status}${snippet ? `: ${snippet}` : ''}`,
    };
  }
}

async function fetchUploadToken(): Promise<string> {
  const res = await fetch('/api/admin/upload/token', { method: 'POST', credentials: 'include' });
  const data = await parseUploadResponse(res);
  if (!res.ok || !data.ok || typeof data.token !== 'string') {
    throw new Error(data.error || 'Could not authorize upload');
  }
  return data.token;
}

/**
 * Resolve where a large upload should be POSTed.
 * `path` is relative to `/api/admin/upload`, e.g. `zip` or `videos`.
 */
export async function resolveLargeUploadTarget(path: string): Promise<UploadTarget> {
  if (DIRECT_BACKEND_URL) {
    const token = await fetchUploadToken();
    return {
      url: `${DIRECT_BACKEND_URL}/api/admin/upload/${path}`,
      headers: { Authorization: `Bearer ${token}` },
    };
  }
  return { url: `${LEGACY_LOCAL_BACKEND}/api/admin/upload/${path}`, headers: {} };
}

export interface LargeUploadOptions {
  onProgress?: (fraction: number) => void;
}

/**
 * Upload a FormData body with progress reporting (XHR, since fetch has no upload progress).
 */
export function uploadLarge(
  path: string,
  formData: FormData,
  options: LargeUploadOptions = {}
): Promise<UploadResponse> {
  return resolveLargeUploadTarget(path).then(
    (target) =>
      new Promise<UploadResponse>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', target.url);
        xhr.withCredentials = true;
        Object.entries(target.headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable && options.onProgress) {
            options.onProgress(evt.loaded / evt.total);
          }
        };
        xhr.onerror = () => reject(new Error('Network error while uploading. Check your connection and try again.'));
        xhr.ontimeout = () => reject(new Error('Upload timed out.'));
        xhr.onload = () => {
          const fakeResponse = new Response(xhr.responseText, { status: xhr.status });
          parseUploadResponse(fakeResponse).then((data) => {
            if (xhr.status >= 200 && xhr.status < 300 && data.ok) {
              resolve(data);
            } else {
              reject(new Error(data.error || `Upload failed (${xhr.status})`));
            }
          });
        };
        xhr.send(formData);
      })
  );
}
