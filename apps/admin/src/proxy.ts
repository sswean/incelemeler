import { NextResponse, type NextRequest } from 'next/server';
import { contentSecurityPolicy, createNonce } from '@incelemeler/utils';

/** Panel yanıtları istek başına nonce'lu CSP ile; çerçeveleme yasak (REQ-GUV-005). */
export function proxy(request: NextRequest) {
  const nonce = createNonce();
  const csp = contentSecurityPolicy(nonce, { dev: process.env.NODE_ENV === 'development' });
  const headers = new Headers(request.headers);
  headers.set('x-nonce', nonce);
  headers.set('Content-Security-Policy', csp);
  const res = NextResponse.next({ request: { headers } });
  res.headers.set('Content-Security-Policy', csp);
  if (request.headers.get('x-forwarded-proto') === 'https') {
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/|favicon\\.ico).*)'],
};
