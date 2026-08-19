import type { Response } from 'express';
import type { CookieOptions } from 'express';

export const SESSION_COOKIE = 'cc_access';
export const REFRESH_COOKIE = 'cc_refresh';

const isProd = process.env.NODE_ENV === 'production';

export const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
};

export function setSessionCookies(res: Response, accessToken: string, refreshToken?: string) {
  res.cookie(SESSION_COOKIE, accessToken, cookieOptions);
  if (refreshToken) {
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
  }
}

export function clearSessionCookies(res: Response) {
  res.clearCookie(SESSION_COOKIE, { ...cookieOptions, maxAge: undefined });
  res.clearCookie(REFRESH_COOKIE, { ...cookieOptions, maxAge: undefined });
}
