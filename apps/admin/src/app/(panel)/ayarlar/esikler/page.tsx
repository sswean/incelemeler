import type { Metadata } from 'next';
import { tr } from '@incelemeler/i18n';
import { Alert, Field, PageTitle, SubmitButton } from '../../../../components/ui';
import { errorMessage } from '../../../../lib/errors';
import { api, requireStaff } from '../../../../lib/session';
import { saveThresholdsAction } from './actions';
import { THRESHOLD_KEYS } from './keys';

export const metadata: Metadata = { title: tr.thresholds.title };
export const dynamic = 'force-dynamic';

/** Yayın eşikleri (§7.2): yalnızca taksonomi yetkisi olanlar değiştirir; denetim kaydına girer. */
export default async function ThresholdsPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string; hata?: string }>;
}) {
  const { token, user } = await requireStaff();
  const { durum, hata } = await searchParams;
  if (!user.permissions.includes('taxonomy.manage')) {
    return (
      <div className="max-w-2xl space-y-4">
        <PageTitle>{tr.thresholds.title}</PageTitle>
        <Alert kind="info">{tr.admin.noPermission}</Alert>
      </div>
    );
  }
  const { data, error } = await (await api(token)).GET('/v1/admin/settings/thresholds');
  return (
    <div className="max-w-2xl space-y-6 rounded-lg border border-border-default bg-bg-default p-6">
      <div className="space-y-1">
        <PageTitle>{tr.thresholds.title}</PageTitle>
        <p className="text-sm text-text-secondary">{tr.thresholds.intro}</p>
      </div>
      {durum === 'kaydedildi' ? <Alert kind="success">{tr.admin.saved}</Alert> : null}
      {hata ? <Alert kind="error">{errorMessage(hata)}</Alert> : null}
      {!data ? (
        <Alert kind="error">{errorMessage((error as { code?: string } | undefined)?.code)}</Alert>
      ) : (
        <form action={saveThresholdsAction} className="space-y-4" aria-label={tr.thresholds.title}>
          <input type="hidden" name="version" value={data.version} />
          {THRESHOLD_KEYS.map((k) => (
            <Field
              key={k}
              id={k}
              type="number"
              label={tr.thresholds[k]}
              required
              defaultValue={String(data[k])}
            />
          ))}
          <SubmitButton>{tr.thresholds.save}</SubmitButton>
        </form>
      )}
    </div>
  );
}
