export { auth as middleware } from '@/auth';

export const config = {
  matcher: [
    // Protect everything except auth routes, static files, and _next
    '/((?!api/auth|signin|_next/static|_next/image|favicon.ico).*)',
  ],
};
