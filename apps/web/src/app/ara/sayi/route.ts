import { serverApi } from '../../../lib/api';
import { parseState, toApiQuery } from '../../../lib/search-state';

/** Filtre panelindeki "Sonuçları göster (N)" için sonuç sayısı (REQ-ARA-012). */
export async function GET(req: Request) {
  const params = Object.fromEntries(
    [...new URL(req.url).searchParams.keys()].map((k) => [
      k,
      new URL(req.url).searchParams.getAll(k),
    ]),
  );
  const state = parseState(params);
  const { data } = await serverApi().GET('/v1/search', {
    params: { query: { ...toApiQuery({ ...state, sayfa: 1 }), pageSize: 1 } as never },
  });
  return Response.json(
    { total: data?.total ?? 0 },
    { headers: { 'Cache-Control': 'public, max-age=30', 'X-Robots-Tag': 'noindex' } },
  );
}
