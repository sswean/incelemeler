import { listingPages, xml } from '../../lib/sitemap';
import { canonical } from '../../lib/seo';

// Çalışma zamanında üretilir (API ve ortam anahtarları derlemede yok); önbellek başlıkla.
export const dynamic = 'force-dynamic';

/** Site haritası dizini (REQ-SEO-006): türe göre bölümlü, her dosya ≤ 50.000 URL. */
export async function GET() {
  const pages = await listingPages();
  const files = ['static.xml', ...pages.map((_, i) => `listings-${i + 1}.xml`), 'articles-1.xml'];
  return xml(
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${files
      .map((f) => `  <sitemap><loc>${canonical(`/sitemaps/${f}`)}</loc></sitemap>`)
      .join('\n')}\n</sitemapindex>`,
  );
}
