import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { tr } from '@incelemeler/i18n';
import { formatLongDate } from '@incelemeler/utils';
import { appealAction, withdrawReviewAction } from '../../degerlendir/actions';
import { Alert, PageTitle } from '../../../components/ui';
import { errorMessage } from '../../../lib/errors';
import { api, getSessionToken } from '../../../lib/session';

const R = tr.reviews;
export const metadata: Metadata = { title: R.mine, robots: { index: false } };
export const dynamic = 'force-dynamic';

/** Değerlendirmelerim (A6.4): durum, gerekçe, düzenle/yeniden gönder, geri çek, itiraz. */
export default async function MyReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string; hata?: string }>;
}) {
  const token = await getSessionToken();
  if (!token) redirect('/giris?sonra=/hesabim/degerlendirmelerim');
  const { durum, hata } = await searchParams;
  const { data } = await (await api(token)).GET('/v1/me/reviews');
  const reviews = data?.data ?? [];
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageTitle>{R.mine}</PageTitle>
      {durum === 'gonderildi' ? <Alert kind="success">{R.submitted}</Alert> : null}
      {durum === 'itiraz' ? <Alert kind="success">{R.appealSent}</Alert> : null}
      {hata ? <Alert kind="error">{errorMessage(hata)}</Alert> : null}
      {reviews.length === 0 ? <p className="text-text-secondary">{R.mineEmpty}</p> : null}
      <ul className="space-y-4">
        {reviews.map((r) => (
          <li
            key={r.id}
            className="space-y-2 rounded-lg border border-border-default p-4"
            data-testid="my-review"
          >
            <p className="font-semibold">
              <Link href={r.listing.path} className="underline">
                {r.listing.name}
              </Link>
            </p>
            <p className="text-sm" data-testid="my-review-status">
              <strong>{r.reported ? R.reportedStatus : R.statuses[r.status]}</strong>
              {r.appeal !== 'NONE' && r.appeal !== 'AVAILABLE'
                ? ` · ${R.appealStates[r.appeal]}`
                : ''}
            </p>
            {r.reasonCode && r.reasonCode !== 'USER_REQUEST' ? (
              <p className="text-sm" data-testid="my-review-reason">
                {R.reasonLabel}: {R.reasons[r.reasonCode]}
                {r.reasonNote ? ` — ${r.reasonNote}` : ''}
              </p>
            ) : null}
            <p className="text-sm text-text-secondary">
              {r.rating}/5 · {formatLongDate(new Date(r.createdAt))}
            </p>
            <p className="line-clamp-3 whitespace-pre-line">{r.body}</p>
            <div className="flex flex-wrap gap-3">
              {['PENDING', 'PUBLISHED', 'REJECTED'].includes(r.status) ? (
                <Link
                  href={`/degerlendir/${r.listing.id}?duzenle=${r.id}`}
                  className="inline-flex min-h-11 items-center underline"
                >
                  {r.status === 'REJECTED' ? R.editAndResubmit : R.edit}
                </Link>
              ) : null}
              {r.status !== 'REMOVED' ? (
                <form action={withdrawReviewAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <button type="submit" className="min-h-11 underline">
                    {R.withdraw}
                  </button>
                </form>
              ) : null}
            </div>
            {r.appeal === 'AVAILABLE' ? (
              <details>
                <summary className="min-h-11 cursor-pointer content-center underline">
                  {R.appeal}
                </summary>
                <form action={appealAction} className="mt-2 space-y-2" aria-label={R.appeal}>
                  <input type="hidden" name="reviewId" value={r.id} />
                  <label className="block space-y-1">
                    <span className="font-medium">{R.appealStatement}</span>
                    <textarea
                      name="statement"
                      required
                      minLength={20}
                      maxLength={2000}
                      rows={3}
                      aria-describedby={`itiraz-${r.id}`}
                      className="block w-full rounded-md border border-border-strong bg-bg-default px-3 py-2"
                    />
                  </label>
                  <p id={`itiraz-${r.id}`} className="text-sm text-text-secondary">
                    {R.appealHint}
                    {r.appealDeadline
                      ? ` ${R.appealDeadline.replace('{tarih}', formatLongDate(new Date(r.appealDeadline)))}`
                      : ''}
                  </p>
                  <button
                    type="submit"
                    className="min-h-11 rounded-md border border-border-strong px-4"
                  >
                    {R.appeal}
                  </button>
                </form>
              </details>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
