import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware.
 * This acts as a 'green light' to ensure requests reach Firebase without loops.
 */
export default function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - firebase/blob (media sync streams)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|firebase|blob).*)',
  ],
};
