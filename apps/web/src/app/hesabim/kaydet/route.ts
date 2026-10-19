import { api, getSessionToken } from '../../../lib/session';

const UUID = /^[0-9a-f-]{36}$/;
const noStore = { 'Cache-Control': 'no-store' };

/** Kaydet düğmesinin durumu (listeleme sayfası ISR'de; kullanıcıya özel durum istemcide alınır). */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('ilan') ?? '';
  const token = await getSessionToken();
  if (!token || !UUID.test(id)) {
    return Response.json({ signedIn: !!token, saved: false }, { headers: noStore });
  }
  const { data } = await (
    await api(token)
  ).GET('/v1/me/favorites/{listingId}', { params: { path: { listingId: id } } });
  return Response.json({ signedIn: !!data, saved: data?.saved ?? false }, { headers: noStore });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { ilan?: unknown; kaydet?: unknown } | null;
  const id = typeof body?.ilan === 'string' ? body.ilan : '';
  const token = await getSessionToken();
  if (!token) return Response.json({ signedIn: false, saved: false }, { status: 401 });
  if (!UUID.test(id)) return Response.json({ saved: false }, { status: 400 });
  const client = await api(token);
  const opts = { params: { path: { listingId: id } } };
  const { data } =
    body?.kaydet === true
      ? await client.PUT('/v1/me/favorites/{listingId}', opts)
      : await client.DELETE('/v1/me/favorites/{listingId}', opts);
  return Response.json(
    { signedIn: true, saved: data?.saved ?? false },
    { status: data ? 200 : 400, headers: noStore },
  );
}
