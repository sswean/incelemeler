import type { Metadata } from 'next';
import { tr } from '@incelemeler/i18n';
import { PageTitle, SubmitButton } from '../../../components/ui';
import { verifyApplicationAction } from '../../applications-actions';

const T = tr.applications;
export const metadata: Metadata = { title: T.verifyTitle, robots: { index: false } };
export const dynamic = 'force-dynamic';

/** E-postadaki bağlantı: doğrulama ayrıca düğmeyle (bağlantı önizleyicileri belirteci kullanmasın). */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ belirtec?: string }>;
}) {
  const { belirtec } = await searchParams;
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageTitle>{T.verifyTitle}</PageTitle>
      <form action={verifyApplicationAction} aria-label={T.verifyTitle}>
        <input type="hidden" name="belirtec" value={belirtec ?? ''} />
        <input type="hidden" name="tur" value="reklam" />
        <SubmitButton>{T.verifyButton}</SubmitButton>
      </form>
    </div>
  );
}
