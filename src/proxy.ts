
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Standard Proxy Export for Next.js 16.
 * The function name MUST match the filename to satisfy platform requirements.
 */
export function proxy(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
