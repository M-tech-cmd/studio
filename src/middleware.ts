import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware.
 * Standard implementation to prevent Internal Server Errors while skipping static assets.
 */
export function middleware(request: NextRequest) {
  // Add resilience: allow internal nextjs requests to bypass middleware logic
  if (request.nextUrl.pathname.startsWith('/_next')) {
    return NextResponse.next();
  }
  
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
