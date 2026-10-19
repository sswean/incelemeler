import type { Metadata } from 'next';
import { tr } from '@incelemeler/i18n';
import { formatLongDate } from '@incelemeler/utils';
import { Alert, Field, PageTitle, SubmitButton } from '../../components/ui';
import { errorMessage } from '../../lib/errors';
import { requestDeletionByEmailAction } from '../account-actions';

const T = tr.account;
export const metadata: Metadata = { title: T.publicTitle, robots: { index: false } };
export const dynamic = 'force-dynamic';

/**
 * Herkese açık hesap silme sayfası (REQ-KVK-020): girişsiz talep, kayıtlı e-postaya onay bağlantısıyla.
 * Mağaza formlarında bu URL kullanılır.
 */
export default async function PublicDeletionPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string; tarih?: string; hata?: string }>;
}) {
  const sp = await searchParams;
  const date = sp.tarih && !Number.isNaN(Date.parse(sp.tarih)) ? new Date(sp.tarih) : null;
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageTitle>{sp.durum === 'bekliyor' ? T.pendingTitle : T.publicTitle}</PageTitle>
      {sp.durum === 'bekliyor' ? (
        <Alert kind="info">
          {T.pendingText.replace('{date}', date ? formatLongDate(date) : '—')}
        </Alert>
      ) : null}
      {sp.durum === 'iptal' ? <Alert kind="success">{T.cancelled}</Alert> : null}
      {sp.durum === 'gonderildi' ? <Alert kind="success">{T.linkSent}</Alert> : null}
      {sp.hata ? <Alert kind="error">{errorMessage(sp.hata)}</Alert> : null}
      {sp.durum === 'bekliyor' || sp.durum === 'iptal' ? null : (
        <>
          <p>{T.publicIntro}</p>
          <form
            action={requestDeletionByEmailAction}
            className="space-y-4"
            aria-label={T.publicTitle}
          >
            <Field id="email" type="email" label={T.email} autoComplete="email" required />
            <SubmitButton>{T.sendLink}</SubmitButton>
          </form>
        </>
      )}
    </div>
  );
}
