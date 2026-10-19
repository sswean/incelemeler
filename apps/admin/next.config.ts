import type { NextConfig } from 'next';

const config: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Görsel yükleme sunucu eylemiyle API'ye iletilir; API sınırı 10 MB (MEDIA_LIMITS).
  experimental: { serverActions: { bodySizeLimit: '11mb' } },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          // CSP (frame-ancestors 'none' dahil) istek başına nonce ile proxy'de (REQ-GUV-005).
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },
};

export default config;
