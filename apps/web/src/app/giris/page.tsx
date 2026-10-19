import type { Metadata } from 'next';
import Link from 'next/link';
import { tr } from '@incelemeler/i18n';
import { Alert, Field, PageTitle, SubmitButton } from '../../components/ui';
import { errorMessage } from '../../lib/errors';
import { loginAction } from '../auth-actions';

export const metadata: Metadata = { title: tr.auth.loginTitle, robots: { index: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string; sonra?: string }>;
}) {
  const { hata, sonra } = await searchParams;
  return (
    <div className="mx-auto max-w-md space-y-6">
      <PageTitle>{tr.auth.loginTitle}</PageTitle>
      {hata ? <Alert kind="error">{errorMessage(hata)}</Alert> : null}
      <form action={loginAction} className="space-y-4">
        {sonra ? <input type="hidden" name="sonra" value={sonra} /> : null}
        <Field id="email" label={tr.auth.email} type="email" required autoComplete="email" />
        <Field
          id="password"
          label={tr.auth.password}
          type="password"
          required
          autoComplete="current-password"
        />
        <SubmitButton>{tr.auth.submitLogin}</SubmitButton>
      </form>
      <p className="text-sm">
        <Link href="/parola-sifirla" className="text-brand-default underline">
          {tr.auth.forgot}
        </Link>
      </p>
      <p className="text-sm">
        {tr.auth.noAccount}{' '}
        <Link href="/kayit" className="text-brand-default underline">
          {tr.auth.registerTitle}
        </Link>
      </p>
    </div>
  );
}
