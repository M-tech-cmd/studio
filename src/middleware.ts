import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware.
 * This acts as a 'green light' to ensure requests reach Firebase without loops.
 * Optimised to bypass static chunks and blob streams to prevent Runtime Errors.
 */
export default function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files - CRITICAL for ChunkLoadError)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - firebase (Firebase SDK endpoints)
     * - firebase-storage (Storage interactions)
     * - blob (local media streams)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|firebase|blob).*)',
  ],
};
