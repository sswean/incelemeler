import type { MetadataRoute } from 'next';
import { canonical, indexingEnabled } from '../lib/seo';

/**
 * robots.txt (REQ-SEO-005/007): indeksleme kapalı ortamlarda (staging/preview/yerel) tamamen kapalı;
 * açıkken yalnızca dış yönlendirme yolu (/git/) taranmaz — noindex sayfalar Disallow edilmez.
 */
// Ortam anahtarı (SITE_INDEXING) çalışma zamanında okunur.
export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  if (!indexingEnabled()) return { rules: [{ userAgent: '*', disallow: '/' }] };
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: '/git/' }],
    sitemap: canonical('/sitemap.xml'),
  };
}
