import type { Metadata } from 'next';
import { tr } from '@incelemeler/i18n';
import { PageTitle, SubmitButton } from '../../../components/ui';
import { cancelDeletionAction } from '../../account-actions';

const T = tr.account;
export const metadata: Metadata = { title: T.cancelTitle, robots: { index: false } };
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
      <PageTitle>{T.cancelTitle}</PageTitle>
      <form action={cancelDeletionAction} aria-label={T.cancelTitle}>
        <input type="hidden" name="belirtec" value={belirtec ?? ''} />
        <SubmitButton>{T.cancelButton}</SubmitButton>
      </form>
    </div>
  );
}
