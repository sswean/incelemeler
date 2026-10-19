import type { Metadata } from 'next';
import { tr } from '@incelemeler/i18n';
import { Alert, Field, PageTitle, SubmitButton } from '../../components/ui';
import { errorMessage } from '../../lib/errors';
import { loginAction } from '../actions';

export const metadata: Metadata = { title: tr.admin.loginTitle };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string }>;
}) {
  const { hata } = await searchParams;
  return (
    <div className="mx-auto max-w-md space-y-6 rounded-lg border border-border-default bg-bg-default p-6">
      <PageTitle>{tr.admin.loginTitle}</PageTitle>
      {hata ? <Alert kind="error">{errorMessage(hata)}</Alert> : null}
      <form action={loginAction} className="space-y-4">
        <Field id="email" label={tr.auth.email} type="email" required autoComplete="username" />
        <Field
          id="password"
          label={tr.auth.password}
          type="password"
          required
          autoComplete="current-password"
        />
        <SubmitButton>{tr.auth.submitLogin}</SubmitButton>
      </form>
    </div>
  );
}
