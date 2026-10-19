import { api, getSessionToken } from '../../../lib/session';

/** Veri dışa aktarma (REQ-HSP-012): JSON dosyası olarak indirilir; önbelleğe alınmaz. */
export async function GET() {
  const token = await getSessionToken();
  if (!token) return new Response(null, { status: 401 });
  const { data } = await (await api(token)).GET('/v1/me/export');
  if (!data) return new Response(null, { status: 401 });
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="incelemeler-verilerim-${data.exportedAt.slice(0, 10)}.json"`,
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}
