import { tr } from '@incelemeler/i18n';
import { serverApi } from '../../../../lib/api';

const NO_INDEX = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};
const FORWARD = ['x-forwarded-for', 'user-agent', 'sec-purpose', 'purpose'] as const;

/** Sponsorlu yerleşim tıklaması (REQ-SPN-009): hedef yalnızca kayıttan çözülen site içi yol. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = new URL(req.url).searchParams.get('ctx') ?? undefined;
  const headers: Record<string, string> = {};
  for (const name of FORWARD) {
    const v = req.headers.get(name);
    if (v) headers[name] = v.slice(0, 300);
  }
  const { data } = await serverApi()
    .GET('/v1/sponsored/{id}/click', {
      params: { path: { id }, query: ctx && ctx.length <= 2000 ? { ctx } : {} },
      headers,
    })
    .catch(() => ({ data: undefined }));
  // Yalnızca site içi mutlak yol (açık yönlendirme yok).
  if (!data?.path || !data.path.startsWith('/') || data.path.startsWith('//')) {
    return new Response(tr.outbound.unavailable, {
      status: 404,
      headers: { ...NO_INDEX, 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
  return new Response(null, { status: 302, headers: { ...NO_INDEX, Location: data.path } });
}
