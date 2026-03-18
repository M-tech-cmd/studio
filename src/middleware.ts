import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

/**
 * Next.js Middleware.
 * Optimized to bypass static assets, JSON chunks, and Firebase internal streams.
 * This prevents ChunkLoadError and 504 Timeouts during heavy media sync.
 */
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for those starting with:
     * - api (API routes)
     * - _next/static (static files - CRITICAL for ChunkLoadError)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - firebase (Firebase SDK endpoints)
     * - blob (local media streams)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|firebase|blob|.*\\.js|.*\\.json).*)',
  ],
};
