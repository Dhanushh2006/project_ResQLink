import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/constants';

// Protect app routes; unauthenticated users are redirected to /login.
const PUBLIC = [
  '/', '/login', '/help', '/product', '/solutions', '/how-it-works',
  '/security', '/about', '/request-access',
];
const PUBLIC_PREFIX = ['/api/auth', '/_next', '/favicon', '/manifest', '/icon'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.includes(pathname)) return NextResponse.next();
  if (PUBLIC_PREFIX.some((p) => pathname.startsWith(p))) return NextResponse.next();

  // API routes handle their own auth (return JSON 401); don't redirect them.
  if (pathname.startsWith('/api')) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
