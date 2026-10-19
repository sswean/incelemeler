import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { tr } from '@incelemeler/i18n';
import { Alert, Field, PageTitle, SubmitButton } from '../../../components/ui';
import { errorMessage } from '../../../lib/errors';
import { getSessionToken } from '../../../lib/session';
import { stepUpAction } from '../../actions';

export const metadata: Metadata = { title: tr.admin.stepUpTitle };
export const dynamic = 'force-dynamic';

/** Kritik işlem için yeniden doğrulama (REQ-HSP-007, REQ-GUV-017). */
export default async function StepUpPage({
  searchParams,
}: {
  searchParams: Promise<{ sonra?: string; hata?: string }>;
}) {
  if (!(await getSessionToken())) redirect('/giris');
  const { sonra, hata } = await searchParams;
  return (
    <div className="mx-auto max-w-md space-y-6 rounded-lg border border-border-default bg-bg-default p-6">
      <PageTitle>{tr.admin.stepUpTitle}</PageTitle>
      <p className="text-sm text-text-secondary">{tr.admin.stepUpIntro}</p>
      {hata ? <Alert kind="error">{errorMessage(hata)}</Alert> : null}
      <form action={stepUpAction} className="space-y-4" aria-label={tr.admin.stepUpTitle}>
        <input type="hidden" name="sonra" value={sonra ?? '/'} />
        <Field id="code" label={tr.admin.mfaCode} required autoComplete="one-time-code" />
        <SubmitButton>{tr.admin.mfaVerify}</SubmitButton>
      </form>
    </div>
  );
}
