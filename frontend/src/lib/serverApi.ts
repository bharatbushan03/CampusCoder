import 'server-only';

import { cookies } from 'next/headers';
import { ApiError } from './api';

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || 'http://localhost:4000';

export async function serverApi<T>(path: string, options?: RequestInit): Promise<T> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/api${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        ...options?.headers,
      },
      cache: 'no-store',
      ...options,
    });
  } catch (fetchErr: any) {
    const isConnRefused = fetchErr?.cause?.code === 'ECONNREFUSED' || fetchErr?.message?.includes('fetch failed');
    throw new ApiError(
      isConnRefused
        ? 'Cannot connect to backend service (port 4000). Please ensure the backend server is running.'
        : fetchErr?.message || 'Backend network request failed',
      503
    );
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(body?.error || `Request failed (${res.status})`, res.status);
  }

  return body as T;
}