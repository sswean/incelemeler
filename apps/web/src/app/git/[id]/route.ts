import { tr } from '@incelemeler/i18n';
import { serverApi } from '../../../lib/api';

const NO_INDEX = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};
const FORWARD = ['x-forwarded-for', 'user-agent', 'sec-purpose', 'purpose'] as const;

/**
 * Dış yönlendirme (REQ-AFF-002/003/005): hedef URL istemciden alınmaz; yalnızca API'nin kayıttan çözdüğü
 * adrese 302. Tıklama kaydı için istemci başlıkları iletilir (ham IP API'de saklanmaz).
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = new URL(req.url).searchParams.get('ctx') ?? undefined;
  const headers: Record<string, string> = {};
  for (const name of FORWARD) {
    const v = req.headers.get(name);
    if (v) headers[name] = v.slice(0, 300);
  }
  const { data } = await serverApi()
    .GET('/v1/outbound/{id}/resolve', {
      params: { path: { id }, query: ctx && ctx.length <= 2000 ? { ctx } : {} },
      headers,
    })
    .catch(() => ({ data: undefined }));
  if (!data?.url) {
    return new Response(tr.outbound.unavailable, {
      status: 404,
      headers: { ...NO_INDEX, 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
  return new Response(null, { status: 302, headers: { ...NO_INDEX, Location: data.url } });
}
