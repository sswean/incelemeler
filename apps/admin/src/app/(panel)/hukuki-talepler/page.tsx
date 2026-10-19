import type { Metadata } from 'next';
import type { TakedownKind } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { Alert, Field, PageTitle, SubmitButton } from '../../../components/ui';
import { errorMessage } from '../../../lib/errors';
import { api, requireStaff } from '../../../lib/session';
import { formatIstanbul } from '../kampanyalar/messages';
import { createTakedownAction, updateTakedownAction } from './actions';

const T = tr.takedown;
export const metadata: Metadata = { title: T.adminTitle };
export const dynamic = 'force-dynamic';

const select =
  'block w-full rounded-md border border-border-strong bg-bg-default px-3 py-2 text-base';
const KINDS = Object.keys(T.kinds) as TakedownKind[];
const NEXT = ['IN_REVIEW', 'ACTIONED', 'REJECTED', 'WITHDRAWN'] as const;

/** Hukuki talepler (REQ-GUN-005): süre sayacı, uyarılar, işlem/ret, resmî karar elle kaydı. */
export default async function TakedownAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string; hata?: string }>;
}) {
  const { token, user } = await requireStaff();
  const sp = await searchParams;
  if (!user.permissions.includes('audit.read')) {
    return (
      <div className="max-w-2xl space-y-4">
        <PageTitle>{T.adminTitle}</PageTitle>
        <Alert kind="info">{tr.admin.noPermission}</Alert>
      </div>
    );
  }
  const { data } = await (await api(token)).GET('/v1/admin/takedown-requests');
  return (
    <div className="max-w-4xl space-y-6 rounded-lg border border-border-default bg-bg-default p-6">
      <div className="space-y-1">
        <PageTitle>{T.adminTitle}</PageTitle>
        <p className="text-sm text-text-secondary">{T.adminIntro}</p>
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
        <ul className="space-y-3">
          {data.data.map((r) => (
            <li
              key={r.id}
              className={`space-y-2 rounded-md border p-4 text-sm ${r.alert === 'OVERDUE' ? 'border-danger-text' : 'border-border-default'}`}
              data-testid="takedown"
            >
              <p className="flex flex-wrap justify-between gap-2">
                <strong>
                  {T.kinds[r.kind]} · {T.statuses[r.status]}
                </strong>
                {r.alert !== 'NONE' ? (
                  <span className="font-semibold" data-testid="takedown-alert">
                    {T.alerts[r.alert]}
                  </span>
                ) : null}
              </p>
              <p className="text-text-secondary">
                {r.requesterName}
                {r.requesterOrg ? ` (${r.requesterOrg})` : ''} · {r.requesterEmail} ·{' '}
                {T.capacities[r.requesterCapacity]} ·{' '}
                {T.received.replace('{date}', formatIstanbul(r.receivedAt))} ·{' '}
                {T.due.replace('{date}', formatIstanbul(r.dueAt))}
              </p>
              {r.authorityReference ? <p>{r.authorityReference}</p> : null}
              <p className="break-all">{r.targetUrl}</p>
              <p className="whitespace-pre-line">{r.legalBasis}</p>
              <form
                action={updateTakedownAction}
                className="grid gap-3 sm:grid-cols-2"
                aria-label={`${T.status}: ${r.requesterName}`}
              >
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="version" value={r.version} />
                <label className="space-y-1">
                  <span className="block font-medium">{T.status}</span>
                  <select name="status" defaultValue="IN_REVIEW" className={select}>
                    {NEXT.map((s) => (
                      <option key={s} value={s}>
                        {T.statuses[s]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="block font-medium">{T.rejectionReason}</span>
                  <select name="rejectionReason" defaultValue="" className={select}>
                    <option value="">{T.noRejection}</option>
                    {Object.entries(T.rejections).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="block font-medium">{T.targetType}</span>
                  <select name="targetType" defaultValue={r.targetType ?? ''} className={select}>
                    <option value="" />
                    {Object.entries(T.targetTypes).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="block font-medium">{T.targetId}</span>
                  <input name="targetId" defaultValue={r.targetId ?? ''} className={select} />
                </label>
                <div className="flex items-start gap-2 sm:col-span-2">
                  <input
                    id={`remove-${r.id}`}
                    name="removeTarget"
                    type="checkbox"
                    value="1"
                    className="mt-1 h-5 w-5"
                  />
                  <label htmlFor={`remove-${r.id}`}>{T.removeTarget}</label>
                </div>
                <label className="space-y-1 sm:col-span-2">
                  <span className="block font-medium">{T.decisionNote}</span>
                  <textarea
                    name="decisionNote"
                    rows={2}
                    maxLength={2000}
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
        action={createTakedownAction}
        aria-label={T.manualTitle}
        className="space-y-3 rounded-md border border-border-default p-4"
      >
        <h2 className="text-lg font-semibold">{T.manualTitle}</h2>
        <label className="block space-y-1">
          <span className="block text-sm font-medium">{T.kind}</span>
          <select name="kind" className={select}>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {T.kinds[k]}
              </option>
            ))}
          </select>
        </label>
        <Field id="td-name" name="requesterName" label={T.requesterName} required />
        <Field id="td-org" name="requesterOrg" label={T.requesterOrg} />
        <Field id="td-email" name="requesterEmail" type="email" label={T.requesterEmail} required />
        <label className="block space-y-1">
          <span className="block text-sm font-medium">{T.requesterCapacity}</span>
          <select name="requesterCapacity" className={select}>
            {Object.entries(T.capacities).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <Field id="td-ref" name="authorityReference" label={T.authorityReference} />
        <Field id="td-url" name="targetUrl" type="url" label={T.targetUrl} required />
        <Field id="td-basis" name="legalBasis" label={T.legalBasis} required minLength={20} />
        <Field
          id="td-received"
          name="receivedAt"
          type="datetime-local"
          label={tr.dsrAdmin.receivedAt}
        />
        <SubmitButton>{T.create}</SubmitButton>
      </form>
    </div>
  );
}
