import type { Metadata } from 'next';
import { tr } from '@incelemeler/i18n';
import { Alert, PageTitle, SubmitButton } from '../../../components/ui';
import { errorMessage } from '../../../lib/errors';
import { sanctionAppealAction } from '../../account-actions';

const T = tr.sanctions;
export const metadata: Metadata = { title: T.appealTitle, robots: { index: false } };
export const dynamic = 'force-dynamic';

/** Yaptırıma itiraz (REQ-GUN-007): e-postadaki imzalı bağlantıyla, girişsiz (askıdaki hesap giriş yapamaz). */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ belirtec?: string; durum?: string; hata?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageTitle>{T.appealTitle}</PageTitle>
      {sp.durum === 'gonderildi' ? (
        <Alert kind="success">{T.appealSent}</Alert>
      ) : (
        <>
          {sp.hata ? <Alert kind="error">{errorMessage(sp.hata)}</Alert> : null}
          <p>{T.appealIntro}</p>
          <form action={sanctionAppealAction} className="space-y-4" aria-label={T.appealTitle}>
            <input type="hidden" name="belirtec" value={sp.belirtec ?? ''} />
            <div className="space-y-1">
              <label htmlFor="statement" className="block text-sm font-medium">
                {T.appealStatement}
              </label>
              <textarea
                id="statement"
                name="statement"
                required
                minLength={10}
                maxLength={2000}
                rows={5}
                className="block w-full rounded-md border border-border-strong bg-bg-default px-3 py-2 text-base"
              />
            </div>
            <SubmitButton>{T.appealSubmit}</SubmitButton>
          </form>
        </>
      )}
    </div>
  );
}
