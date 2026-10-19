import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Konum izni şu an hiçbir sayfada gerekmiyor; gerektiğinde yalnızca o rotada açılır (REQ-GUV-005).
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

const config: NextConfig = {
  poweredByHeader: false,
  // Sondaki eğik çizgi 308 yerine proxy'de 301 ile normalleştirilir (REQ-SEO-003).
  skipTrailingSlashRedirect: true,
  reactStrictMode: true,
  // Görsel varyantları (AVIF/WebP, srcset) teslimde üretilir (ADR-0007); kaynak yalnızca /medya vekili.
  images: {
    formats: ['image/avif', 'image/webp'],
    localPatterns: [{ pathname: '/medya/**' }],
  },
  // Monorepo paketleri derlenmiş dist çıktısı olarak tüketilir.
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default config;
