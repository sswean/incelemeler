import type { Metadata } from 'next';
import { tr } from '@incelemeler/i18n';
import { Alert, PageTitle } from '../../../../components/ui';
import { api, requireStaff } from '../../../../lib/session';
import { formatIstanbul, formatKurus } from '../../kampanyalar/messages';

const T = tr.revenueAdmin;
const N = tr.admin.noData;
export const metadata: Metadata = { title: T.title };
export const dynamic = 'force-dynamic';

const iso = (d: Date) => d.toISOString().slice(0, 10);
const valid = (v: string | undefined) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

/** Gelir raporu (REQ-ADM-010): yalnızca gerçek ya da elle girilmiş veriden, kaynağı etiketli. */
export default async function RevenuePage({
  searchParams,
}: {
  searchParams: Promise<{ baslangic?: string; bitis?: string }>;
}) {
  const { token, user } = await requireStaff();
  const sp = await searchParams;
  if (!user.permissions.includes('campaigns.amount')) {
    return (
      <div className="max-w-2xl space-y-4">
        <PageTitle>{T.title}</PageTitle>
        <Alert kind="info">{tr.admin.noPermission}</Alert>
      </div>
    );
  }
  const now = new Date();
  const from = valid(sp.baslangic) ?? iso(new Date(now.getFullYear(), now.getMonth(), 1));
  const to = valid(sp.bitis) ?? iso(now);
  const { data: r } = await (
    await api(token)
  ).GET('/v1/admin/reports/revenue', { params: { query: { from, to } } });
  return (
    <div className="max-w-4xl space-y-6 rounded-lg border border-border-default bg-bg-default p-6">
      <div className="space-y-1">
        <PageTitle>{T.title}</PageTitle>
        <p className="text-sm text-text-secondary">{T.intro}</p>
      </div>
      <form className="flex flex-wrap items-end gap-3" aria-label={T.title}>
        <label className="space-y-1">
          <span className="block text-sm font-medium">{T.from}</span>
          <input
            type="date"
            name="baslangic"
            defaultValue={from}
            className="block min-h-11 rounded-md border border-border-strong bg-bg-default px-3"
          />
        </label>
        <label className="space-y-1">
          <span className="block text-sm font-medium">{T.to}</span>
          <input
            type="date"
            name="bitis"
            defaultValue={to}
            className="block min-h-11 rounded-md border border-border-strong bg-bg-default px-3"
          />
        </label>
        <button type="submit" className="min-h-11 rounded-md border border-border-strong px-4">
          {T.show}
        </button>
        <a
          href={`/raporlar/gelir/csv?baslangic=${from}&bitis=${to}`}
          className="min-h-11 content-center underline"
        >
          {T.csv}
        </a>
      </form>
      {!r ? (
        <Alert kind="error">{tr.errors.UNKNOWN}</Alert>
      ) : (
        <>
          <p className="text-sm">
            {tr.admin.updatedAt.replace('{date}', formatIstanbul(r.generatedAt))}
          </p>
          {r.sponsorship.length === 0 ? (
            <p data-testid="revenue-empty">{N}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" data-testid="revenue-table">
                <thead>
                  <tr>
                    <th scope="col">{T.campaign}</th>
                    <th scope="col">{T.sponsor}</th>
                    <th scope="col">{T.period}</th>
                    <th scope="col">{T.amount}</th>
                    <th scope="col">{T.source}</th>
                  </tr>
                </thead>
                <tbody>
                  {r.sponsorship.map((c) => (
                    <tr key={c.campaignId}>
                      <td>{c.campaign}</td>
                      <td>{c.sponsor}</td>
                      <td>
                        {formatIstanbul(c.startsAt)} – {formatIstanbul(c.endsAt)}
                      </td>
                      <td>{c.amountKurus === null ? N : formatKurus(c.amountKurus)}</td>
                      <td>{T.manual}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <dl className="grid gap-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-text-secondary">{T.total}</dt>
              <dd>{r.sponsorshipTotalKurus === null ? N : formatKurus(r.sponsorshipTotalKurus)}</dd>
            </div>
            <div>
              <dt className="text-text-secondary">{T.affiliateEstimated}</dt>
              <dd>{N}</dd>
            </div>
            <div>
              <dt className="text-text-secondary">{T.affiliateConfirmed}</dt>
              <dd>{N}</dd>
            </div>
          </dl>
        </>
      )}
    </div>
  );
}
