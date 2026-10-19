import type { Metadata } from 'next';
import { tr } from '@incelemeler/i18n';
import { PageTitle, SubmitButton } from '../../../components/ui';
import { confirmDeletionAction } from '../../account-actions';

const T = tr.account;
export const metadata: Metadata = { title: T.confirmTitle, robots: { index: false } };
export const dynamic = 'force-dynamic';

/** E-postadaki bağlantı: işlem açık bir düğmeyle yapılır (bağlantı önizleyicileri belirteci tüketmesin). */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ belirtec?: string }>;
}) {
  const { belirtec } = await searchParams;
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageTitle>{T.confirmTitle}</PageTitle>
      <form action={confirmDeletionAction} aria-label={T.confirmTitle}>
        <input type="hidden" name="belirtec" value={belirtec ?? ''} />
        <SubmitButton>{T.confirmButton}</SubmitButton>
      </form>
    </div>
  );
}
