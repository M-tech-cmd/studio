import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware.
 * Optimized to bypass static assets, JSON chunks, and Firebase internal streams.
 * This prevents ChunkLoadError and 504 Timeouts during heavy media sync.
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
     * - Any path ending in .js or .json (Static chunks)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|firebase|blob|.*\\.js$|.*\\.json$).*)',
  ],
};
