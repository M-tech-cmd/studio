import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
/**
 * Next.js Proxy/Middleware.
 * Pure pass-through to ensure authentication state is managed 100% on the client.
 * This prevents server-side redirect loops during Google Authentication.
 */
export function middleware(request: NextRequest) {
  return NextResponse.next();
}
export const config = { 
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};