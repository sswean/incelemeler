import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { tr } from '@incelemeler/i18n';
import { Alert, PageTitle } from '../../../../components/ui';
import { errorMessage } from '../../../../lib/errors';
import { api, requireStaff } from '../../../../lib/session';
import { setListingStatusAction } from '../actions';
import { blockerMessage, UI_TRANSITIONS } from '../messages';
import { ListingEditForm } from './edit-form';

export const metadata: Metadata = { title: tr.listings.title };
export const dynamic = 'force-dynamic';

export default async function ListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ durum?: string; hata?: string }>;
}) {
  const { token, user } = await requireStaff();
  const { id } = await params;
  const { durum, hata } = await searchParams;
  const client = await api(token);
  const { data: listing } = await client.GET('/v1/admin/listings/{id}', {
    params: { path: { id } },
  });
  if (!listing) notFound();
  const [{ data: schema }, { data: provinces }, { data: districts }] = await Promise.all([
    client.GET('/v1/admin/categories/{id}/schema', {
      params: { path: { id: listing.primaryCategory.id } },
    }),
    client.GET('/v1/admin-areas', { params: { query: { level: 'PROVINCE' } } }),
    client.GET('/v1/admin-areas', { params: { query: { level: 'DISTRICT' } } }),
  ]);
  const canPublish = user.permissions.includes('listings.write');
  const transitions = UI_TRANSITIONS[listing.status].filter(
    (s) => canPublish || s === 'DRAFT' || s === 'IN_REVIEW',
  );

  return (
    <div className="max-w-3xl space-y-8 rounded-lg border border-border-default bg-bg-default p-6">
      <div className="space-y-1">
        <PageTitle>{listing.name}</PageTitle>
        <p className="text-sm text-text-secondary" data-testid="listing-meta">
          {tr.taxonomy.kindLabels[listing.kind]} · {listing.primaryCategory.name} ·{' '}
          {tr.listings.status}: {tr.listings.statuses[listing.status]}
          {listing.dataOrigin === 'DEMO' ? ` · ${tr.listings.demoBadge}` : ''}
        </p>
      </div>
      {durum === 'kaydedildi' || durum === 'olusturuldu' ? (
        <Alert kind="success">{tr.admin.saved}</Alert>
      ) : null}
      {hata ? <Alert kind="error">{errorMessage(hata)}</Alert> : null}

      <section aria-labelledby="yayin" className="space-y-3">
        <h2 id="yayin" className="text-lg font-semibold">
          {tr.listings.blockersTitle}
        </h2>
        {listing.publishBlockers.length === 0 ? (
          <p className="text-sm text-success-text">{tr.listings.readyToPublish}</p>
        ) : (
          <ul className="list-disc space-y-1 pl-6 text-sm" data-testid="publish-blockers">
            {listing.publishBlockers.map((b) => (
              <li key={`${b.pointer}-${b.code}`}>{blockerMessage(b.code)}</li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-3" aria-label={tr.listings.statusActions}>
          {transitions.map((s) => (
            <form key={s} action={setListingStatusAction}>
              <input type="hidden" name="id" value={listing.id} />
              <input type="hidden" name="version" value={listing.version} />
              <input type="hidden" name="status" value={s} />
              <button
                type="submit"
                className="min-h-11 rounded-md border border-border-strong px-4 text-sm"
              >
                {tr.listings.transitions[s]}
              </button>
            </form>
          ))}
        </div>
      </section>

      <ListingEditForm
        listing={listing}
        attributes={schema?.attributes ?? []}
        provinces={provinces?.data ?? []}
        districts={districts?.data ?? []}
      />
    </div>
  );
}
