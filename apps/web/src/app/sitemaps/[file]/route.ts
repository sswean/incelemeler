import { articlePages, listingPages, urlset, xml } from '../../../lib/sitemap';
import { canonical } from '../../../lib/seo';

// Çalışma zamanında üretilir (API ve ortam anahtarları derlemede yok); önbellek başlıkla.
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (file === 'static.xml') return xml(urlset([{ loc: canonical('/') }]));
  if (file === 'articles-1.xml') return xml(urlset(await articlePages()));
  const m = /^listings-(\d+)\.xml$/.exec(file);
  if (!m) return new Response(null, { status: 404 });
  const pages = await listingPages();
  const page = pages[Number(m[1]) - 1];
  if (!page) return new Response(null, { status: 404 });
  return xml(urlset(page));
}
