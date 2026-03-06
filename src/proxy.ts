import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Standard Next.js 16 Proxy.
 * The function name MUST be 'proxy' to match the filename.
 */
export function proxy(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
