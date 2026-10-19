import type { Metadata } from 'next';
import { tr } from '@incelemeler/i18n';
import { Alert, Field, PageTitle, SubmitButton } from '../../../components/ui';
import { errorMessage } from '../../../lib/errors';
import { api, requireStaff } from '../../../lib/session';
import { formatIstanbul } from '../kampanyalar/messages';
import { createDataRequestAction, updateDataRequestAction } from './actions';

const T = tr.dsrAdmin;
const P = tr.privacy;
export const metadata: Metadata = { title: T.title };
export const dynamic = 'force-dynamic';

const select =
  'block w-full rounded-md border border-border-strong bg-bg-default px-3 py-2 text-base';
const STATUSES = Object.keys(T.statuses) as Array<keyof typeof T.statuses>;
const TYPES = Object.keys(P.types) as Array<keyof typeof P.types>;

/** KVKK başvuruları (REQ-KVK-022): süre sayacı, uyarılar, süresi geçen alarmı, gerekçeli ret şablonu. */
export default async function DataRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string; hata?: string }>;
}) {
  const { token, user } = await requireStaff();
  const sp = await searchParams;
  if (!user.permissions.includes('audit.read')) {
    return (
      <div className="max-w-2xl space-y-4">
        <PageTitle>{T.title}</PageTitle>
        <Alert kind="info">{tr.admin.noPermission}</Alert>
      </div>
    );
  }
  const { data } = await (await api(token)).GET('/v1/admin/data-requests');
  return (
    <div className="max-w-4xl space-y-6 rounded-lg border border-border-default bg-bg-default p-6">
      <div className="space-y-1">
        <PageTitle>{T.title}</PageTitle>
        <p className="text-sm text-text-secondary">{T.intro}</p>
      </div>
      {data && data.overdue > 0 ? (
        <Alert kind="error">{T.overdueAlarm.replace('{n}', String(data.overdue))}</Alert>
      ) : null}
      {sp.durum === 'kaydedildi' ? <Alert kind="success">{T.saved}</Alert> : null}
      {sp.durum === 'olusturuldu' ? <Alert kind="success">{T.created}</Alert> : null}
      {sp.hata ? <Alert kind="error">{errorMessage(sp.hata)}</Alert> : null}
      {!data?.data.length ? (
        <p>{T.empty}</p>
      ) : (
        <ul className="space-y-3" data-testid="data-requests">
          {data.data.map((r) => (
            <li
              key={r.id}
              className={`space-y-2 rounded-md border p-4 text-sm ${
                r.alert === 'OVERDUE' ? 'border-danger-text' : 'border-border-default'
              }`}
              data-testid="data-request"
            >
              <p className="flex flex-wrap justify-between gap-2">
                <strong>{P.types[r.type]}</strong>
                {r.alert !== 'NONE' ? (
                  <span className="font-semibold" data-testid="dsr-alert">
                    {T.alerts[r.alert]}
                  </span>
                ) : null}
              </p>
              <p className="text-text-secondary">
                {r.email} · {T.channels[r.channel]} ·{' '}
                {r.identityVerified ? T.verified : T.unverified} ·{' '}
                {T.received.replace('{date}', formatIstanbul(r.receivedAt))} ·{' '}
                {T.due.replace('{date}', formatIstanbul(r.dueAt))} ·{' '}
                {T.elapsed.replace('{n}', String(r.daysElapsed))}
              </p>
              <p className="whitespace-pre-line">{r.description}</p>
              <form
                action={updateDataRequestAction}
                className="grid gap-3 sm:grid-cols-3"
                aria-label={`${T.status}: ${r.email}`}
              >
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="version" value={r.version} />
                <label className="space-y-1">
                  <span className="block font-medium">{T.status}</span>
                  <select name="status" defaultValue={r.status} className={select}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {T.statuses[s]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="block font-medium">{T.rejectionReason}</span>
                  <select
                    name="rejectionReason"
                    defaultValue={r.rejectionReason ?? ''}
                    className={select}
                  >
                    <option value="">{T.noRejection}</option>
                    {Object.entries(T.rejections).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 sm:col-span-3">
                  <span className="block font-medium">{T.responseNote}</span>
                  <textarea
                    name="responseNote"
                    rows={2}
                    maxLength={4000}
                    defaultValue={r.responseNote ?? ''}
                    className="block w-full rounded-md border border-border-strong bg-bg-default px-2 py-1"
                  />
                </label>
                <div>
                  <SubmitButton>{T.save}</SubmitButton>
                </div>
              </form>
            </li>
          ))}
        </ul>
      )}
      <form
        action={createDataRequestAction}
        aria-label={T.manualTitle}
        className="space-y-3 rounded-md border border-border-default p-4"
      >
        <h2 className="text-lg font-semibold">{T.manualTitle}</h2>
        <label className="block space-y-1">
          <span className="block text-sm font-medium">{T.type}</span>
          <select name="type" className={select}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {P.types[t]}
              </option>
            ))}
          </select>
        </label>
        <Field id="dsr-email" name="email" type="email" label={T.email} required />
        <Field
          id="dsr-description"
          name="description"
          label={T.description}
          required
          minLength={10}
        />
        <Field id="dsr-received" name="receivedAt" type="datetime-local" label={T.receivedAt} />
        <SubmitButton>{T.create}</SubmitButton>
      </form>
    </div>
  );
}
