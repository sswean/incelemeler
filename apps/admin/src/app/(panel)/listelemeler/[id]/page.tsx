import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { tr } from '@incelemeler/i18n';
import { Alert, PageTitle } from '../../../../components/ui';
import { errorMessage } from '../../../../lib/errors';
import { api, requireStaff } from '../../../../lib/session';
import { setListingStatusAction } from '../actions';
import { blockerMessage, UI_TRANSITIONS } from '../messages';
import { ListingEditForm } from './edit-form';
import { HoursSection } from './hours-section';
import { VerdictSection } from './verdict-section';
import { MediaSection } from './media-section';
import { OutboundSection } from './outbound-section';

export const metadata: Metadata = { title: tr.listings.title };
export const dynamic = 'force-dynamic';

export default async function ListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    durum?: string;
    hata?: string;
    baglanti?: string;
    saat?: string;
    degerlendirme?: string;
  }>;
}) {
  const { token, user } = await requireStaff();
  const { id } = await params;
  const { durum, hata, baglanti, saat, degerlendirme } = await searchParams;
  const client = await api(token);
  const { data: listing } = await client.GET('/v1/admin/listings/{id}', {
    params: { path: { id } },
  });
  if (!listing) notFound();
  const canVerdict = user.permissions.includes('editorial.verdict.write');
  const canLinks = user.permissions.some((p) => p === 'outbound.add' || p === 'affiliate.manage');
  const [
    { data: schema },
    { data: provinces },
    { data: districts },
    links,
    providers,
    hours,
    verdict,
  ] = await Promise.all([
    client.GET('/v1/admin/categories/{id}/schema', {
      params: { path: { id: listing.primaryCategory.id } },
    }),
    client.GET('/v1/admin-areas', { params: { query: { level: 'PROVINCE' } } }),
    client.GET('/v1/admin-areas', { params: { query: { level: 'DISTRICT' } } }),
    canLinks
      ? client.GET('/v1/admin/listings/{id}/outbound-links', { params: { path: { id } } })
      : Promise.resolve({ data: undefined }),
    canLinks ? client.GET('/v1/admin/integration-providers') : Promise.resolve({ data: undefined }),
    client.GET('/v1/admin/listings/{id}/opening-hours', { params: { path: { id } } }),
    canVerdict
      ? client.GET('/v1/admin/listings/{id}/verdict', { params: { path: { id } } })
      : Promise.resolve({ data: undefined }),
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
      {hata && !baglanti && !saat && !degerlendirme ? (
        <Alert kind="error">{errorMessage(hata)}</Alert>
      ) : null}

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

      <MediaSection listing={listing} />

      {links.data ? (
        <OutboundSection
          listingId={listing.id}
          kind={listing.kind}
          links={links.data.data}
          providers={providers.data?.data ?? []}
          canCommercial={user.permissions.includes('affiliate.manage')}
          {...(durum ? { notice: durum } : {})}
          {...(baglanti ? { linkError: baglanti } : {})}
        />
      ) : null}

      {hours.data ? (
        <HoursSection
          listingId={listing.id}
          hours={hours.data}
          saved={durum === 'saatler-kaydedildi'}
          {...(saat ? { error: saat } : {})}
        />
      ) : null}

      {verdict.data ? (
        <VerdictSection
          listingId={listing.id}
          state={verdict.data}
          {...(durum ? { notice: durum } : {})}
          {...(degerlendirme ? { error: degerlendirme } : {})}
        />
      ) : null}

      <ListingEditForm
        listing={listing}
        attributes={schema?.attributes ?? []}
        provinces={provinces?.data ?? []}
        districts={districts?.data ?? []}
      />
    </div>
  );
}
