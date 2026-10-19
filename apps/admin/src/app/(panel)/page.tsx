import { tr } from '@incelemeler/i18n';
import { serverApi } from '../../lib/api';
import { api, requireStaff } from '../../lib/session';
import { formatIstanbul } from './kampanyalar/messages';

export const dynamic = 'force-dynamic';

const A = tr.admin;

/** Genel pano (REQ-ADM-002): yalnızca gerçek sayaçlar; sabit/örnek istatistik gösterilmez (AK-02). */
export default async function AdminHome() {
  const { token } = await requireStaff();
  const [result, dash] = await Promise.all([
    serverApi()
      .GET('/v1/health')
      .catch(() => null),
    (await api(token)).GET('/v1/admin/dashboard').catch(() => ({ data: undefined })),
  ]);
  const health = result?.data;
  const d = dash.data;
  const rows: Array<[string, number | null, string]> = d
    ? [
        [A.pendingModeration, d.pendingModeration, 'pendingModeration'],
        [A.openReports, d.openReports, 'openReports'],
        [A.staleListings, d.staleListings, 'staleListings'],
        [A.openDataRequests, d.openDataRequests, 'openDataRequests'],
        [A.overdueDataRequests, d.overdueDataRequests, 'overdueDataRequests'],
        [A.activeCampaigns, d.activeCampaigns, 'activeCampaigns'],
        [A.applications, null, 'applications'],
      ]
    : [];

  return (
    <div className="space-y-6">
      {d ? (
        <section
          aria-labelledby="genel"
          className="space-y-4 rounded-lg border border-border-default bg-bg-default p-6"
          data-testid="dashboard"
        >
          <h2 id="genel" className="text-xl font-semibold">
            {A.dashboardTitle}
          </h2>
          <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            {rows.map(([label, value, key]) => (
              <div
                key={key}
                className="flex justify-between gap-4 border-b border-border-default py-1"
              >
                <dt>{label}</dt>
                <dd data-testid={`dash-${key}`}>{value === null ? A.noData : value}</dd>
              </div>
            ))}
          </dl>
          <h3 className="font-semibold">{A.last7Days}</h3>
          <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            {(
              [
                [A.searches, d.last7Days.searches],
                [A.outboundClicks, d.last7Days.outboundClicks],
                [A.reviewsSubmitted, d.last7Days.reviewsSubmitted],
                [A.favoritesAdded, d.last7Days.favoritesAdded],
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <dt className="text-text-secondary">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-text-secondary">
            {A.updatedAt.replace('{date}', formatIstanbul(d.generatedAt))}
          </p>
        </section>
      ) : null}
      <section
        aria-labelledby="durum"
        className="rounded-lg border border-border-default bg-bg-default p-6"
      >
        <h1 id="durum" className="mb-4 text-xl font-semibold">
          {tr.admin.systemStatus}
        </h1>
        {health ? (
          <dl className="grid grid-cols-2 gap-2 text-sm" data-testid="system-status">
            <dt>{tr.admin.apiStatus}</dt>
            <dd className="text-success-text">{tr.admin.up}</dd>
            <dt>{tr.admin.databaseStatus}</dt>
            <dd className={health.database === 'up' ? 'text-success-text' : 'text-danger-text'}>
              {health.database === 'up' ? tr.admin.up : tr.admin.down}
            </dd>
          </dl>
        ) : (
          <p role="alert" className="text-danger-text">
            {tr.admin.unreachable}
          </p>
        )}
      </section>
    </div>
  );
}
