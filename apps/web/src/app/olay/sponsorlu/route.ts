import { serverApi } from '../../../lib/api';

const FORWARD = ['x-forwarded-for', 'user-agent', 'sec-purpose', 'purpose'] as const;

/** Görüntülenme olayı vekili (tarayıcı API'ye doğrudan bağlanmaz). Kişisel veri iletilmez. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    token?: unknown;
    automated?: unknown;
  } | null;
  if (!body || typeof body.token !== 'string' || body.token.length > 2000) {
    return new Response(null, { status: 400 });
  }
  const headers: Record<string, string> = {};
  for (const name of FORWARD) {
    const v = req.headers.get(name);
    if (v) headers[name] = v.slice(0, 300);
  }
  await serverApi()
    .POST('/v1/sponsored/events', {
      body: { token: body.token, type: 'VIEWED', automated: body.automated === true },
      headers,
    })
    .catch(() => undefined);
  return new Response(null, { status: 202, headers: { 'Cache-Control': 'no-store' } });
}
