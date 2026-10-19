/**
 * İstek başına nonce'lu içerik güvenlik politikası (REQ-GUV-005). Satır içi betikler yalnızca nonce ile;
 * `strict-dynamic` güvenilir betiklerin yüklediklerine izin verir. JSON-LD veri blokları yürütülmez.
 */
export function contentSecurityPolicy(nonce: string, opts: { dev?: boolean } = {}): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${opts.dev ? " 'unsafe-eval'" : ''}`,
    // Tailwind + bileşen içi `style` öznitelikleri (odak noktası vb.).
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');
}

/** Rastgele nonce (Web Crypto; Node ve Edge çalışma ortamlarında). */
export function createNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
