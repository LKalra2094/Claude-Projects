import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check for Auth.js session token cookie (Edge-compatible, no Node.js imports)
  const token =
    request.cookies.get('authjs.session-token') ||
    request.cookies.get('__Secure-authjs.session-token');

  if (!token) {
    const signInUrl = new URL('/signin', request.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protect everything except auth routes, static files, and _next
    '/((?!api/auth|signin|_next/static|_next/image|favicon.ico).*)',
  ],
};
