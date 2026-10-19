import { serverApi } from '../../../lib/api';

/** Otomatik tamamlama vekili (tarayıcı API'ye doğrudan bağlanmaz). */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get('q')?.trim() ?? '';
  if (q.length < 2 || q.length > 100) {
    return Response.json({ places: [], categories: [], listings: [], articles: [] });
  }
  const { data } = await serverApi().GET('/v1/search/suggest', { params: { query: { q } } });
  return Response.json(data ?? { places: [], categories: [], listings: [], articles: [] }, {
    headers: { 'Cache-Control': 'public, max-age=60', 'X-Robots-Tag': 'noindex' },
  });
}
