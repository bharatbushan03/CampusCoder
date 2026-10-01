import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const SESSION_COOKIE = 'cc_access';
const AUTH_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password'];

function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isAuthRoute(pathname)) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (sessionCookie) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', request.url);
  const redirectPath = `${pathname}${search}`;
  if (redirectPath !== '/') {
    loginUrl.searchParams.set('redirect', redirectPath);
  }

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt)$).*)',
  ],
};
