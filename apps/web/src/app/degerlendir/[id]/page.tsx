import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { tr } from '@incelemeler/i18n';
import { Alert, PageTitle } from '../../../components/ui';
import { serverApi } from '../../../lib/api';
import { api, currentUser, getSessionToken } from '../../../lib/session';
import { EMPTY_DRAFT, type DraftData } from './draft';
import { ReviewForm } from './review-form';

const R = tr.reviews;
type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ duzenle?: string }>;
};

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: R.write, robots: { index: false, follow: false } };

/** Değerlendirme yazma/düzenleme (A6.4): misafir yazmaya başlayabilir; gönderimde giriş istenir. */
export default async function WriteReviewPage(props: Props) {
  const { id } = await props.params;
  const { duzenle } = await props.searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { data: ctx } = await serverApi().GET('/v1/listings/{id}/review-form', {
    params: { path: { id } },
  });
  if (!ctx) notFound();
  const user = await currentUser();
  const token = await getSessionToken();

  let initial: DraftData | null = null;
  let editing: { id: string; version: number } | undefined;
  if (user && token) {
    const client = await api(token);
    if (duzenle) {
      const mine = (await client.GET('/v1/me/reviews')).data?.data ?? [];
      const r = mine.find((x) => x.id === duzenle && x.listing.id === id);
      if (r) {
        editing = { id: r.id, version: r.version };
        initial = {
          ...EMPTY_DRAFT,
          rating: r.rating,
          title: r.title ?? '',
          body: r.body,
          criteria: Object.fromEntries(r.criteriaRatings.map((c) => [c.criterionId, c.rating])),
          experienceMonth: r.experienceMonth ?? '',
          usageDuration: r.usageDuration ?? '',
          visitContext: r.visitContext ?? '',
          incentivized: r.incentivized,
        };
      }
    } else {
      const draft = (
        await client.GET('/v1/me/review-drafts/{listingId}', {
          params: { path: { listingId: id } },
        })
      ).data;
      if (draft) initial = { ...EMPTY_DRAFT, ...(draft.data as Partial<DraftData>) };
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <p className="text-sm">
        <Link href={ctx.listing.path} className="underline">
          {ctx.listing.name}
        </Link>
      </p>
      <PageTitle>{R.writeTitle.replace('{ad}', ctx.listing.name)}</PageTitle>
      {user && !user.emailVerified ? <Alert kind="info">{R.verifyEmailFirst}</Alert> : null}
      {!ctx.ugcEnabled ? (
        <Alert kind="info">{R.fieldErrors.ugc_disabled}</Alert>
      ) : (
        <ReviewForm
          ctx={ctx}
          signedIn={Boolean(user)}
          initial={initial}
          reviewId={editing?.id}
          version={editing?.version}
        />
      )}
    </div>
  );
}
