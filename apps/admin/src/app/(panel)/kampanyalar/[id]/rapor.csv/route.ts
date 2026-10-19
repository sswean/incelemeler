import { api, getSessionToken } from '../../../../../lib/session';

const csvCell = (v: string | number | null) => {
  const s = v === null ? '' : String(v);
  // Formül enjeksiyonuna karşı (=, +, -, @ ile başlayan hücre metin olarak işaretlenir).
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/** Kampanya raporu CSV (REQ-SPN-011): yalnızca sayılan olayların günlük toplamları; kişisel veri yok. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = await getSessionToken();
  if (!token) return new Response(null, { status: 401 });
  const { id } = await params;
  const { data } = await (
    await api(token)
  ).GET('/v1/admin/campaigns/{id}/report', { params: { path: { id } } });
  if (!data) return new Response(null, { status: 404 });
  const rows: Array<Array<string | number | null>> = [
    ['tarih', 'sunulan', 'goruntulenen_gosterim', 'tiklama', 'tiklama_orani'],
    ...data.daily.map((d) => [d.date, d.served, d.viewed, d.clicks, d.ctr]),
    ['toplam', data.totals.served, data.totals.viewed, data.totals.clicks, data.totals.ctr],
    [],
    ['son_guncelleme', data.generatedAt],
    ['donusum', 'Dönüşüm verisi yok'],
  ];
  const body = '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="kampanya-${id}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
