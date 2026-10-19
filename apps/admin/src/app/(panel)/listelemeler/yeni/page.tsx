import type { Metadata } from 'next';
import { tr } from '@incelemeler/i18n';
import { PageTitle } from '../../../../components/ui';
import { api, requireStaff } from '../../../../lib/session';
import { CreateListingForm } from './create-form';

export const metadata: Metadata = { title: tr.listings.newListing };
export const dynamic = 'force-dynamic';

export default async function NewListingPage() {
  const { token } = await requireStaff();
  const { data } = await (await api(token)).GET('/v1/admin/categories');
  return (
    <div className="max-w-2xl space-y-6 rounded-lg border border-border-default bg-bg-default p-6">
      <PageTitle>{tr.listings.newListing}</PageTitle>
      <p className="text-sm text-text-secondary">{tr.listings.createIntro}</p>
      <CreateListingForm
        categories={data?.data ?? []}
        allowDemo={process.env.APP_ENV !== 'production'}
      />
    </div>
  );
}
