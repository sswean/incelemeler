import { cookies } from 'next/headers';
import { AnalyticsEventBody, CONSENT_COOKIE, decodeConsent } from '@incelemeler/contracts';
import { api, getSessionToken } from '../../../lib/session';

const FORWARD = ['x-forwarded-for', 'user-agent', 'sec-purpose', 'purpose'] as const;

/**
 * Rızalı olay vekili (REQ-ANL-001, REQ-KVK-012): analitik onayı yoksa olay hiç iletilmez; anonim kimlik
 * istemciden değil tercih çerezinden alınır.
 */
export async function POST(req: Request) {
  const consent = decodeConsent((await cookies()).get(CONSENT_COOKIE)?.value);
  if (!consent?.analytics) return new Response(null, { status: 204 });
  const parsed = AnalyticsEventBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new Response(null, { status: 400 });
  const headers: Record<string, string> = {};
  for (const name of FORWARD) {
    const v = req.headers.get(name);
    if (v) headers[name] = v.slice(0, 300);
  }
  await (
    await api(await getSessionToken())
  )
    .POST('/v1/analytics/events', {
      body: { event: parsed.data, anonymousId: consent.anonymousId },
      headers,
    })
    .catch(() => undefined);
  return new Response(null, { status: 202, headers: { 'Cache-Control': 'no-store' } });
}
