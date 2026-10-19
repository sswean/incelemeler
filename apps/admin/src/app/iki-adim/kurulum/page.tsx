import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { tr } from '@incelemeler/i18n';
import { PageTitle } from '../../../components/ui';
import { api, getSessionToken, pathForMfa } from '../../../lib/session';
import { MfaSetupForm } from './setup-form';

export const metadata: Metadata = { title: tr.admin.mfaSetupTitle };
export const dynamic = 'force-dynamic';

/** Personel için 2FA kurulumu zorunludur (REQ-HSP-007). */
export default async function MfaSetupPage() {
  const token = await getSessionToken();
  if (!token) redirect('/giris');
  const client = await api(token);
  const { data: me } = await client.GET('/v1/me');
  if (!me) redirect('/giris');
  if (me.mfa !== 'SETUP_REQUIRED') redirect(pathForMfa(me.mfa));
  const { data: setup } = await client.POST('/v1/auth/mfa/setup');
  if (!setup) redirect('/giris');
  return (
    <div className="mx-auto max-w-md space-y-6 rounded-lg border border-border-default bg-bg-default p-6">
      <PageTitle>{tr.admin.mfaSetupTitle}</PageTitle>
      <MfaSetupForm secret={setup.secret} otpauthUrl={setup.otpauthUrl} />
    </div>
  );
}
