import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Protect Account routes
  if (pathname.startsWith('/account')) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Protect Admin routes
  if (pathname.startsWith('/admin')) {
    // Note: We can't easily check the role inside middleware without decoding the JWT.
    // For now, we redirect to login if no token. The backend will handle role enforcement.
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 3. Redirect logged-in users away from login/register
  if (token && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path*', '/admin/:path*', '/login', '/register'],
};
