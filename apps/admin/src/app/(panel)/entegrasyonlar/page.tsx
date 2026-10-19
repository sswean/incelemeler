import type { Metadata } from 'next';
import { tr } from '@incelemeler/i18n';
import { Alert, Field, PageTitle, SubmitButton } from '../../../components/ui';
import { errorMessage } from '../../../lib/errors';
import { api, requireStaff } from '../../../lib/session';
import { createProviderAction, updateProviderStatusAction } from './actions';

const T = tr.integrations;
export const metadata: Metadata = { title: T.title };
export const dynamic = 'force-dynamic';

const STATUSES = Object.keys(T.statuses) as Array<keyof typeof T.statuses>;
const select =
  'block w-full rounded-md border border-border-strong bg-bg-default px-3 py-2 text-base';

/**
 * Entegrasyon sağlayıcıları (REQ-AFF-001, AK-06): doğrulanmamış sağlayıcı yalnızca bağlantı düzeyinde
 * kaydedilir; sırlar ortam değişkeninde, burada yalnızca adları.
 */
export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string; hata?: string }>;
}) {
  const { token, user } = await requireStaff();
  const { durum, hata } = await searchParams;
  const canView = user.permissions.some((p) => p === 'outbound.add' || p === 'affiliate.manage');
  const canEdit = user.permissions.includes('affiliate.manage');
  if (!canView) {
    return (
      <div className="max-w-2xl space-y-4">
        <PageTitle>{T.title}</PageTitle>
        <Alert kind="info">{tr.admin.noPermission}</Alert>
      </div>
    );
  }
  const { data, error } = await (await api(token)).GET('/v1/admin/integration-providers');
  return (
    <div className="max-w-3xl space-y-6 rounded-lg border border-border-default bg-bg-default p-6">
      <div className="space-y-1">
        <PageTitle>{T.title}</PageTitle>
        <p className="text-sm text-text-secondary">{T.intro}</p>
      </div>
      {durum === 'eklendi' ? <Alert kind="success">{T.created}</Alert> : null}
      {durum === 'kaydedildi' ? <Alert kind="success">{T.saved}</Alert> : null}
      {hata ? <Alert kind="error">{errorMessage(hata)}</Alert> : null}
      {!data ? (
        <Alert kind="error">{errorMessage((error as { code?: string } | undefined)?.code)}</Alert>
      ) : data.data.length === 0 ? (
        <p>{T.empty}</p>
      ) : (
        <ul className="space-y-3" data-testid="providers">
          {data.data.map((p) => (
            <li key={p.id} className="space-y-2 rounded-md border border-border-default p-3">
              <p className="font-medium">
                {p.name} <span className="text-sm text-text-secondary">({p.key})</span>
              </p>
              <p className="text-sm">
                {T.domains}: {p.allowedDomains.join(', ')}
              </p>
              {canEdit ? (
                <form
                  action={updateProviderStatusAction}
                  className="flex flex-wrap items-end gap-3"
                  aria-label={`${T.status}: ${p.name}`}
                >
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="version" value={p.version} />
                  <div className="space-y-1">
                    <label htmlFor={`status-${p.id}`} className="block text-sm font-medium">
                      {T.status}
                    </label>
                    <select
                      id={`status-${p.id}`}
                      name="integrationStatus"
                      defaultValue={p.integrationStatus}
                      className={select}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {T.statuses[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <SubmitButton>{T.save}</SubmitButton>
                </form>
              ) : (
                <p className="text-sm">
                  {T.status}: {T.statuses[p.integrationStatus]}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
      {canEdit ? (
        <form
          action={createProviderAction}
          aria-label={T.add}
          className="space-y-3 rounded-md border border-border-default p-4"
        >
          <h2 className="text-lg font-semibold">{T.add}</h2>
          <Field id="key" label={T.key} required maxLength={60} />
          <Field id="name" label={T.name} required maxLength={120} />
          <div className="space-y-1">
            <label htmlFor="integrationStatus" className="block text-sm font-medium">
              {T.status}
            </label>
            <select
              id="integrationStatus"
              name="integrationStatus"
              defaultValue="LINK_ONLY"
              className={select}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {T.statuses[s]}
                </option>
              ))}
            </select>
          </div>
          <Field id="allowedDomains" label={T.domains} required />
          <Field id="termsUrl" type="url" label={T.termsUrl} />
          <Field id="docsUrl" type="url" label={T.docsUrl} />
          <Field id="credentialEnvNames" label={T.credentialEnvNames} />
          <SubmitButton>{T.add}</SubmitButton>
        </form>
      ) : null}
    </div>
  );
}
