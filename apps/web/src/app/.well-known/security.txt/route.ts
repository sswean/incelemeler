import { STATIC_PATHS } from '@incelemeler/routes';
import { canonical } from '../../../lib/seo';

/** Ortam adresi ve süre çalışma zamanında hesaplanır. */
export const dynamic = 'force-dynamic';

const VALID_DAYS = 180;

/**
 * RFC 9116 security.txt (REQ-GUV-016) — TASLAK. İletişim kanalı olarak sorumlu açıklama sayfası
 * gösterilir; güvenlik e-posta adresi İnsan onayıyla eklenir (gerçek adres uydurulmaz).
 */
export function GET(): Response {
  const expires = new Date(Date.now() + VALID_DAYS * 86_400_000);
  expires.setUTCHours(0, 0, 0, 0);
  const body = [
    '# TASLAK — yayına geçmeden önce güvenlik iletişim adresi eklenecektir.',
    `Contact: ${canonical(STATIC_PATHS.disclosure)}`,
    `Expires: ${expires.toISOString()}`,
    'Preferred-Languages: tr, en',
    `Canonical: ${canonical('/.well-known/security.txt')}`,
    `Policy: ${canonical(STATIC_PATHS.disclosure)}`,
    '',
  ].join('\n');
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
