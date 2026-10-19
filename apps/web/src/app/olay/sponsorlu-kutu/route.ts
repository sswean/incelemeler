import { serverApi } from '../../../lib/api';

/** Listeleme detayındaki rakip sponsorlu kutu (önbelleğe alınmaz — kampanya bitince hemen kalkar). */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('ilan') ?? '';
  if (!/^[0-9a-f-]{36}$/.test(id)) return Response.json({ data: [] }, { status: 400 });
  const { data } = await serverApi()
    .GET('/v1/listings/{id}/sponsored', { params: { path: { id } } })
    .catch(() => ({ data: undefined }));
  return Response.json(data ?? { data: [] }, {
    headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  });
}
