import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { tr } from '@incelemeler/i18n';
import { PageTitle } from '../../../components/ui';
import { api, getSessionToken } from '../../../lib/session';
import { removeFavoriteAction } from '../../account-actions';

const T = tr.account;
export const metadata: Metadata = { title: T.saved, robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function SavedPage() {
  const token = await getSessionToken();
  if (!token) redirect('/giris?sonra=%2Fhesabim%2Fkaydedilenler');
  const { data } = await (await api(token)).GET('/v1/me/favorites');
  if (!data) redirect('/giris?sonra=%2Fhesabim%2Fkaydedilenler');
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageTitle>{T.saved}</PageTitle>
      {data.data.length === 0 ? (
        <p>{T.savedEmpty}</p>
      ) : (
        <ul className="space-y-3" data-testid="saved-list">
          {data.data.map((f) => (
            <li
              key={f.listing.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-default p-4"
            >
              <span>
                <Link href={f.listing.path} className="font-semibold text-brand-default underline">
                  {f.listing.title}
                </Link>
                {f.listing.subtitle ? (
                  <span className="block text-sm text-text-secondary">{f.listing.subtitle}</span>
                ) : null}
              </span>
              <form action={removeFavoriteAction}>
                <input type="hidden" name="listingId" value={f.listing.id} />
                <button type="submit" className="min-h-11 text-brand-default underline">
                  {T.unsave}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
