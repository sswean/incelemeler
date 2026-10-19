import type { Metadata } from 'next';
import Link from 'next/link';
import { tr } from '@incelemeler/i18n';
import { Alert, Field, PageTitle, SubmitButton } from '../../../components/ui';
import { errorMessage } from '../../../lib/errors';
import { api, requireStaff } from '../../../lib/session';
import { createCampaignAction, createOrganizationAction } from './actions';
import { fieldMessage, formatIstanbul } from './messages';

const T = tr.campaigns;
export const metadata: Metadata = { title: T.title };
export const dynamic = 'force-dynamic';

const select =
  'block w-full rounded-md border border-border-strong bg-bg-default px-3 py-2 text-base';

/** Kampanya listesi ve oluşturma (Ek A8.4). Tutar alanı yalnızca `campaigns.amount` yetkisiyle görünür. */
export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string; hata?: string; alan?: string }>;
}) {
  const { token, user } = await requireStaff();
  const sp = await searchParams;
  const canManage = user.permissions.includes('campaigns.manage');
  if (!canManage && !user.permissions.includes('content.publish')) {
    return (
      <div className="max-w-2xl space-y-4">
        <PageTitle>{T.title}</PageTitle>
        <Alert kind="info">{tr.admin.noPermission}</Alert>
      </div>
    );
  }
  const client = await api(token);
  const [{ data: list }, orgs] = await Promise.all([
    client.GET('/v1/admin/campaigns'),
    canManage ? client.GET('/v1/admin/organizations') : Promise.resolve({ data: undefined }),
  ]);
  const amount = user.permissions.includes('campaigns.amount');
  return (
    <div className="max-w-4xl space-y-6 rounded-lg border border-border-default bg-bg-default p-6">
      <div className="space-y-1">
        <PageTitle>{T.title}</PageTitle>
        <p className="text-sm text-text-secondary">{T.intro}</p>
      </div>
      {sp.durum === 'kurulus' ? <Alert kind="success">{T.organizationCreated}</Alert> : null}
      {sp.hata ? (
        <Alert kind="error">{fieldMessage(sp.alan) ?? errorMessage(sp.hata)}</Alert>
      ) : null}

      {!list?.data.length ? (
        <p>{T.empty}</p>
      ) : (
        <ul className="space-y-2" data-testid="campaigns">
          {list.data.map((c) => (
            <li key={c.id} className="rounded-md border border-border-default p-3">
              <Link
                href={`/kampanyalar/${c.id}`}
                className="font-medium text-brand-default underline"
              >
                {c.name}
              </Link>
              <p className="text-sm text-text-secondary">
                {c.sponsor.name} · {T.statuses[c.status]} · {formatIstanbul(c.startsAt)} –{' '}
                {formatIstanbul(c.endsAt)}
                {c.dataOrigin === 'DEMO' ? ` · ${T.demo}` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}

      {canManage ? (
        <>
          <form
            action={createCampaignAction}
            aria-label={T.newCampaign}
            className="space-y-3 rounded-md border border-border-default p-4"
          >
            <h2 className="text-lg font-semibold">{T.newCampaign}</h2>
            <Field id="name" label={T.name} required maxLength={160} />
            <div className="space-y-1">
              <label htmlFor="sponsorId" className="block text-sm font-medium">
                {T.sponsor}
              </label>
              <select id="sponsorId" name="sponsorId" required className={select}>
                {orgs.data?.data.length ? null : <option value="">{T.noSponsor}</option>}
                {orgs.data?.data.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
            <Field id="startsAt" type="datetime-local" label={T.startsAt} required />
            <Field id="endsAt" type="datetime-local" label={T.endsAt} required />
            {amount ? <Field id="budget" type="number" label={T.budget} /> : null}
            <Field id="contractRef" label={T.contractRef} maxLength={120} />
            <SubmitButton>{T.create}</SubmitButton>
          </form>
          <form
            action={createOrganizationAction}
            aria-label={T.newOrganization}
            className="space-y-3 rounded-md border border-border-default p-4"
          >
            <h2 className="text-lg font-semibold">{T.newOrganization}</h2>
            <Field id="org-name" name="name" label={T.organizationName} required maxLength={160} />
            <div className="space-y-1">
              <label htmlFor="org-type" className="block text-sm font-medium">
                {T.organizationType}
              </label>
              <select id="org-type" name="type" defaultValue="ADVERTISER" className={select}>
                {Object.entries(T.organizationTypes).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <SubmitButton>{T.addOrganization}</SubmitButton>
          </form>
        </>
      ) : null}
    </div>
  );
}
