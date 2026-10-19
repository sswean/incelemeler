import type { Metadata } from 'next';
import Link from 'next/link';
import { tr } from '@incelemeler/i18n';
import { Alert, Checkbox, Field, PageTitle, SubmitButton } from '../../components/ui';
import { errorMessage } from '../../lib/errors';
import { registerAction } from '../auth-actions';

export const metadata: Metadata = { title: tr.auth.registerTitle, robots: { index: false } };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string; durum?: string }>;
}) {
  const { hata, durum } = await searchParams;
  if (durum === 'gonderildi') {
    return (
      <div className="mx-auto max-w-md space-y-6">
        <PageTitle>{tr.auth.registerTitle}</PageTitle>
        <Alert kind="success">{tr.auth.registered}</Alert>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-md space-y-6">
      <PageTitle>{tr.auth.registerTitle}</PageTitle>
      {hata ? <Alert kind="error">{errorMessage(hata)}</Alert> : null}
      <form action={registerAction} className="space-y-4">
        <Field
          id="displayName"
          label={tr.auth.displayName}
          required
          minLength={2}
          maxLength={60}
          autoComplete="nickname"
          hint={tr.auth.displayNameHint}
        />
        <Field id="email" label={tr.auth.email} type="email" required autoComplete="email" />
        <Field
          id="password"
          label={tr.auth.password}
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          hint={tr.auth.passwordHint}
        />
        <Checkbox id="ageConfirm" label={tr.auth.ageConfirm} required />
        <Checkbox
          id="termsConfirm"
          required
          label={
            <>
              <Link href="/kullanim-kosullari" className="text-brand-default underline">
                {tr.auth.termsConfirm}
              </Link>
            </>
          }
        />
        <p className="text-sm text-text-secondary">
          <Link href="/kvkk-aydinlatma-metni" className="underline">
            {tr.auth.privacyNotice}
          </Link>
        </p>
        <SubmitButton>{tr.auth.submitRegister}</SubmitButton>
      </form>
      <p className="text-sm">
        {tr.auth.haveAccount}{' '}
        <Link href="/giris" className="text-brand-default underline">
          {tr.auth.loginTitle}
        </Link>
      </p>
    </div>
  );
}
