import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { tr } from '@incelemeler/i18n';
import { Alert, Field, PageTitle, SubmitButton } from '../../components/ui';
import { errorMessage } from '../../lib/errors';
import { api, getSessionToken, pathForMfa } from '../../lib/session';
import { mfaVerifyAction } from '../actions';

export const metadata: Metadata = { title: tr.admin.mfaVerifyTitle };
export const dynamic = 'force-dynamic';

export default async function MfaVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string }>;
}) {
  const token = await getSessionToken();
  if (!token) redirect('/giris');
  const { data: me } = await (await api(token)).GET('/v1/me');
  if (!me) redirect('/giris');
  if (me.mfa !== 'VERIFY_REQUIRED') redirect(pathForMfa(me.mfa));
  const { hata } = await searchParams;
  return (
    <div className="mx-auto max-w-md space-y-6 rounded-lg border border-border-default bg-bg-default p-6">
      <PageTitle>{tr.admin.mfaVerifyTitle}</PageTitle>
      <p className="text-sm text-text-secondary">{tr.admin.mfaVerifyIntro}</p>
      {hata ? <Alert kind="error">{errorMessage(hata)}</Alert> : null}
      <form action={mfaVerifyAction} className="space-y-4">
        <Field id="code" label={tr.admin.mfaCode} required autoComplete="one-time-code" />
        <SubmitButton>{tr.admin.mfaVerify}</SubmitButton>
      </form>
    </div>
  );
}
