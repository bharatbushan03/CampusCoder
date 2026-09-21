import { createHmac, timingSafeEqual } from 'node:crypto';

export const UPLOAD_TOKEN_TTL_SECONDS = 15 * 60;

export interface UploadTokenPayload {
  id: string;
  email?: string;
  role: string;
  exp: number;
}

function getSecret(): string {
  const secret = process.env.UPLOAD_TOKEN_SECRET || process.env.SUPABASE_SECRET_KEY;
  if (!secret) {
    throw new Error('UPLOAD_TOKEN_SECRET (or SUPABASE_SECRET_KEY) must be set to sign upload tokens');
  }
  return secret;
}

function sign(data: string): string {
  return createHmac('sha256', getSecret()).update(data).digest('base64url');
}

export function createUploadToken(user: { id: string; email?: string }, role: string): string {
  const payload: UploadTokenPayload = {
    id: user.id,
    email: user.email,
    role,
    exp: Math.floor(Date.now() / 1000) + UPLOAD_TOKEN_TTL_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}.${sign(encoded)}`;
}

export function verifyUploadToken(token: string): UploadTokenPayload | null {
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;

  const expected = Buffer.from(sign(encoded));
  const provided = Buffer.from(signature);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as UploadTokenPayload;
    if (typeof payload.id !== 'string' || typeof payload.role !== 'string' || typeof payload.exp !== 'number') {
      return null;
    }
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
