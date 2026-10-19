import type { Metadata } from 'next';
import { tr } from '@incelemeler/i18n';
import { Alert, PageTitle } from '../../components/ui';
import { api } from '../../lib/session';

export const metadata: Metadata = { title: tr.auth.registerTitle, robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  let ok = false;
  if (token) {
    const { response } = await (await api()).POST('/v1/auth/verify-email', { body: { token } });
    ok = response.status === 200;
  }
  return (
    <div className="mx-auto max-w-md space-y-6">
      <PageTitle>{tr.auth.registerTitle}</PageTitle>
      <Alert kind={ok ? 'success' : 'error'}>{ok ? tr.auth.verifyOk : tr.auth.verifyFail}</Alert>
    </div>
  );
}
