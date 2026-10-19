import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { tr } from '@incelemeler/i18n';
import { Alert, PageTitle } from '../../../../components/ui';
import { errorMessage } from '../../../../lib/errors';
import { api, requireStaff } from '../../../../lib/session';
import { MediaLicenseForm } from './license-form';

export const metadata: Metadata = { title: tr.media.editLicense };
export const dynamic = 'force-dynamic';

export default async function MediaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ listeleme?: string; durum?: string; hata?: string }>;
}) {
  const { token } = await requireStaff();
  const { id } = await params;
  const { listeleme, durum, hata } = await searchParams;
  const { data: media } = await (
    await api(token)
  ).GET('/v1/admin/media/{id}', { params: { path: { id } } });
  if (!media) notFound();
  const back =
    listeleme && /^[0-9a-f-]{36}$/i.test(listeleme) ? `/listelemeler/${listeleme}` : null;
  return (
    <div className="max-w-2xl space-y-6 rounded-lg border border-border-default bg-bg-default p-6">
      <PageTitle>{tr.media.editLicense}</PageTitle>
      {durum === 'kaydedildi' ? <Alert kind="success">{tr.admin.saved}</Alert> : null}
      {hata ? <Alert kind="error">{errorMessage(hata)}</Alert> : null}
      <img
        src={`/medya-icerik/${media.id}`}
        alt={media.altText ?? ''}
        width={media.width}
        height={media.height}
        className="max-h-80 w-auto rounded"
      />
      <p className={`text-sm ${media.licenseComplete ? 'text-success-text' : 'text-danger-text'}`}>
        {media.licenseComplete ? tr.media.licenseOk : tr.media.licenseMissing} · {media.width}×
        {media.height} · {media.mime}
      </p>
      <MediaLicenseForm media={media} back={back} />
      {back ? (
        <Link href={back} className="text-brand-default underline">
          {tr.media.back}
        </Link>
      ) : null}
    </div>
  );
}
