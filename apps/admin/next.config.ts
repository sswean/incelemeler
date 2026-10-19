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
          // Panel çerçeve içine alınamaz (REQ-GUV-005); arama motorlarına kapalı (REQ-ADM-001).
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },
};

export default config;
