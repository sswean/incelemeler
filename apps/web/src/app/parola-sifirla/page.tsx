import type { Metadata } from 'next';
import Link from 'next/link';
import { tr } from '@incelemeler/i18n';
import { Alert, Field, PageTitle, SubmitButton } from '../../components/ui';
import { errorMessage } from '../../lib/errors';
import { confirmResetAction, requestResetAction } from '../auth-actions';

export const metadata: Metadata = { title: tr.auth.resetTitle, robots: { index: false } };

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; hata?: string; durum?: string }>;
}) {
  const { token, hata, durum } = await searchParams;
  return (
    <div className="mx-auto max-w-md space-y-6">
      <PageTitle>{tr.auth.resetTitle}</PageTitle>
      {hata ? <Alert kind="error">{errorMessage(hata)}</Alert> : null}
      {durum === 'gonderildi' ? <Alert kind="info">{tr.auth.resetRequested}</Alert> : null}
      {durum === 'degisti' ? (
        <>
          <Alert kind="success">{tr.auth.resetDone}</Alert>
          <Link href="/giris" className="text-brand-default underline">
            {tr.auth.loginTitle}
          </Link>
        </>
      ) : token ? (
        <form action={confirmResetAction} className="space-y-4">
          <input type="hidden" name="token" value={token} />
          <Field
            id="newPassword"
            label={tr.auth.newPassword}
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            hint={tr.auth.passwordHint}
          />
          <SubmitButton>{tr.auth.resetConfirm}</SubmitButton>
        </form>
      ) : durum ? null : (
        <form action={requestResetAction} className="space-y-4">
          <Field id="email" label={tr.auth.email} type="email" required autoComplete="email" />
          <SubmitButton>{tr.auth.resetRequest}</SubmitButton>
        </form>
      )}
    </div>
  );
}
