import { tr } from '@incelemeler/i18n';
import { serverApi } from '../lib/api';
import { requireStaff } from '../lib/session';
import { logoutAction } from './actions';

export const dynamic = 'force-dynamic';

/** Faz 0: yalnızca gerçek sistem durumu. Sabit/örnek istatistik gösterilmez (AK-02). */
export default async function AdminHome() {
  const { user } = await requireStaff();
  const result = await serverApi()
    .GET('/v1/health')
    .catch(() => null);
  const health = result?.data;

  return (
    <div className="space-y-6">
      <div
        className="flex flex-wrap items-center justify-between gap-4 text-sm"
        data-testid="staff-identity"
      >
        <p>
          {tr.admin.signedInAs}: <strong>{user.displayName}</strong> · {tr.admin.roles}:{' '}
          {user.roles.join(', ')}
        </p>
        <form action={logoutAction}>
          <button type="submit" className="min-h-11 text-brand-default underline">
            {tr.auth.logout}
          </button>
        </form>
      </div>
      <p role="note" className="text-sm text-text-secondary">
        {tr.admin.phaseNotice}
      </p>
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
