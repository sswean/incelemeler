import type { Metadata } from 'next';
import { tr } from '@incelemeler/i18n';
import { STATIC_PATHS } from '@incelemeler/routes';
import { AdvertisingApplicationForm } from '../../components/applications/application-form';
import { Alert, PageTitle } from '../../components/ui';
import { applicationOptions } from '../../lib/application-options';
import { errorMessage } from '../../lib/errors';
import { canonical, robots } from '../../lib/seo';

const T = tr.applications;
export const metadata: Metadata = {
  title: T.adTitle,
  description: T.adIntro,
  alternates: { canonical: canonical(STATIC_PATHS.advertise) },
  robots: robots(true),
};
// Kategori ve il listeleri istek anında (yayın durumu değişebilir).
export const dynamic = 'force-dynamic';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string; hata?: string }>;
}) {
  const sp = await searchParams;
  const { categories, provinces } = await applicationOptions();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageTitle>{T.adTitle}</PageTitle>
      {sp.durum === 'dogrulandi' ? <Alert kind="success">{T.verified}</Alert> : null}
      {sp.hata ? <Alert kind="error">{errorMessage(sp.hata)}</Alert> : null}
      <p>{T.adIntro}</p>
      <AdvertisingApplicationForm categories={categories} provinces={provinces} />
    </div>
  );
}
