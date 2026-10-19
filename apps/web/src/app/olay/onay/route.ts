import { ConsentBody } from '@incelemeler/contracts';
import { api, getSessionToken } from '../../../lib/session';

/** Rıza kaydı vekili (REQ-KVK-003): oturum varsa üyeye bağlanır; IP yalnızca API'de karma olarak tutulur. */
export async function POST(req: Request) {
  const parsed = ConsentBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new Response(null, { status: 400 });
  const token = await getSessionToken();
  await (await api(token)).POST('/v1/consents', { body: parsed.data }).catch(() => undefined);
  return new Response(null, { status: 202, headers: { 'Cache-Control': 'no-store' } });
}
