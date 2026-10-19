import { api, getSessionToken } from '../../../../../lib/session';

const cell = (v: string | number | null) => {
  const s = v === null ? '' : String(v);
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
const valid = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

/** Gelir raporu CSV (REQ-ADM-010): kaynak sütunu etiketli; affiliate verisi yoksa boş değil "veri yok". */
export async function GET(req: Request) {
  const token = await getSessionToken();
  if (!token) return new Response(null, { status: 401 });
  const url = new URL(req.url);
  const from = valid(url.searchParams.get('baslangic'));
  const to = valid(url.searchParams.get('bitis'));
  if (!from || !to) return new Response(null, { status: 400 });
  const { data } = await (
    await api(token)
  ).GET('/v1/admin/reports/revenue', { params: { query: { from, to } } });
  if (!data) return new Response(null, { status: 403 });
  const rows: Array<Array<string | number | null>> = [
    ['kampanya', 'sponsor', 'durum', 'baslangic', 'bitis', 'tutar_kurus', 'kaynak'],
    ...data.sponsorship.map((c) => [
      c.campaign,
      c.sponsor,
      c.status,
      c.startsAt,
      c.endsAt,
      c.amountKurus,
      'elle_girilen_sozlesme',
    ]),
    [],
    ['affiliate_tahmini', 'veri yok'],
    ['affiliate_onayli', 'veri yok'],
    ['son_guncelleme', data.generatedAt],
  ];
  return new Response('﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n', {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="gelir-${from}-${to}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
