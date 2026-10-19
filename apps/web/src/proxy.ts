import { NextResponse, type NextRequest } from 'next/server';
import { tr } from '@incelemeler/i18n';
import { listingPath, normalizePath, parseListingPath } from '@incelemeler/routes';
import { contentSecurityPolicy, createNonce } from '@incelemeler/utils';

/**
 * URL normalleştirme ve listeleme yönlendirmeleri (REQ-SEO-003, REQ-VER-013, REQ-SEO-012):
 * büyük harf / sondaki eğik çizgi → 301; taşınmış slug ve yanlış tür öneki → 301 (zincirsiz);
 * kalıcı olarak kaldırılmış listeleme → 410.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const normalized = normalizePath(pathname);
  if (normalized) return redirect301(request, normalized + search);
  if (await maintenanceOn()) return maintenance();

  const ref = parseListingPath(pathname);
  if (!ref) return withCsp(request);
  const base = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';
  let res: Response;
  try {
    res = await fetch(`${base}/v1/listings/resolve?slug=${encodeURIComponent(ref.slug)}`, {
      cache: 'no-store',
    });
  } catch {
    return withCsp(request); // API erişilemezse sayfa kendi hata durumunu gösterir.
  }
  if (!res.ok) return withCsp(request);
  const r = (await res.json()) as {
    status: 'ok' | 'moved' | 'gone' | 'missing';
    kind: Parameters<typeof listingPath>[0]['kind'] | null;
    slug: string | null;
    carRental: boolean;
  };
  if ((r.status === 'ok' || r.status === 'moved') && r.kind && r.slug) {
    const target = listingPath({ kind: r.kind, slug: r.slug, carRental: r.carRental });
    return target === pathname ? withCsp(request) : redirect301(request, target + search);
  }
  if (r.status === 'gone') return gone();
  return withCsp(request);
}

/**
 * Sayfa yanıtları istek başına nonce'lu CSP ile (REQ-GUV-005); Next satır içi betiklerine nonce'u istek
 * başlığından alır. HSTS yalnızca HTTPS arkasında (preload kararı İnsan).
 */
function withCsp(request: NextRequest): NextResponse {
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

/** Bakım modu (REQ-OPS-009): API işletim durumu kısa süre önbelleklenir; API'ye ulaşılamazsa bakım sayılmaz. */
let maintenanceCache: { at: number; on: boolean } | null = null;
async function maintenanceOn(): Promise<boolean> {
  if (maintenanceCache && Date.now() - maintenanceCache.at < 10_000) return maintenanceCache.on;
  const base = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';
  try {
    const res = await fetch(`${base}/v1/ops/status`, { cache: 'no-store' });
    const on = res.ok && ((await res.json()) as { maintenance?: boolean }).maintenance === true;
    maintenanceCache = { at: Date.now(), on };
    return on;
  } catch {
    return false;
  }
}

export function maintenance(): NextResponse {
  const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${tr.common.maintenanceTitle} · ${tr.brand.name}</title></head><body><main><h1>${tr.common.maintenanceTitle}</h1><p>${tr.common.maintenanceBody}</p></main></body></html>`;
  return new NextResponse(html, {
    status: 503,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Retry-After': '300',
      'Cache-Control': 'no-store',
    },
  });
}

function redirect301(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 301);
}

function gone() {
  const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${tr.common.goneTitle} · ${tr.brand.name}</title></head><body><main><h1>${tr.common.goneTitle}</h1><p>${tr.common.goneBody}</p><p><a href="/">${tr.common.backHome}</a></p></main></body></html>`;
  return new NextResponse(html, {
    status: 410,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
  });
}

export const config = {
  // Statik varlıklar, görsel vekili ve Next iç yolları hariç.
  matcher: ['/((?!_next/|medya/|favicon\\.ico|robots\\.txt|sitemap).*)'],
};
