import type { Metadata } from 'next';
import { tr } from '@incelemeler/i18n';
import { Alert, PageTitle, SubmitButton } from '../../../../components/ui';
import { errorMessage } from '../../../../lib/errors';
import { api, requireStaff } from '../../../../lib/session';
import { formatIstanbul } from '../../kampanyalar/messages';
import { updateOpsSwitchesAction } from './actions';

const T = tr.opsAdmin;
export const metadata: Metadata = { title: T.title };
export const dynamic = 'force-dynamic';

const KEYS = Object.keys(T.switches) as Array<keyof typeof T.switches>;

/** Acil kapatma anahtarları ve bakım modu (REQ-OPS-009). */
export default async function OpsPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string; hata?: string }>;
}) {
  const { token, user } = await requireStaff();
  const sp = await searchParams;
  if (!user.permissions.some((p) => p === 'system.settings' || p === 'audit.read')) {
    return (
      <div className="max-w-2xl space-y-4">
        <PageTitle>{T.title}</PageTitle>
        <Alert kind="info">{tr.admin.noPermission}</Alert>
      </div>
    );
  }
  const { data } = await (await api(token)).GET('/v1/admin/ops-switches');
  if (!data) return <Alert kind="error">{errorMessage(null)}</Alert>;
  return (
    <div className="max-w-2xl space-y-6 rounded-lg border border-border-default bg-bg-default p-6">
      <div className="space-y-1">
        <PageTitle>{T.title}</PageTitle>
        <p className="text-sm text-text-secondary">{T.intro}</p>
        <p className="text-sm text-text-secondary">
          {data.updatedAt
            ? T.lastChange.replace('{date}', formatIstanbul(data.updatedAt))
            : T.never}
        </p>
      </div>
      {sp.durum === 'kaydedildi' ? <Alert kind="success">{T.saved}</Alert> : null}
      {sp.hata ? <Alert kind="error">{errorMessage(sp.hata)}</Alert> : null}
      <form action={updateOpsSwitchesAction} className="space-y-4" aria-label={T.title}>
        <input type="hidden" name="version" value={data.version} />
        <fieldset className="space-y-3">
          <legend className="sr-only">{T.title}</legend>
          {KEYS.map((k) => (
            <div key={k} className="flex items-start gap-2">
              <input
                id={k}
                name={k}
                type="checkbox"
                value="1"
                defaultChecked={data[k]}
                className="mt-1 h-5 w-5"
              />
              <label htmlFor={k}>{T.switches[k]}</label>
            </div>
          ))}
        </fieldset>
        <label className="block space-y-1">
          <span className="block text-sm font-medium">{T.reason}</span>
          <input
            name="reason"
            required
            minLength={5}
            maxLength={500}
            className="block w-full rounded-md border border-border-strong bg-bg-default px-3 py-2 text-base"
          />
        </label>
        <SubmitButton>{T.save}</SubmitButton>
      </form>
    </div>
  );
}
