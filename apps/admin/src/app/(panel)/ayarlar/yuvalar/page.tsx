import type { Metadata } from 'next';
import { tr } from '@incelemeler/i18n';
import { Alert, Field, PageTitle, SubmitButton } from '../../../../components/ui';
import { errorMessage } from '../../../../lib/errors';
import { api, requireStaff } from '../../../../lib/session';
import { updateSlotAction } from '../../kampanyalar/actions';
import { fieldMessage } from '../../kampanyalar/messages';

const S = tr.slotsAdmin;
export const metadata: Metadata = { title: S.title };
export const dynamic = 'force-dynamic';

/** Yuva kataloğu (REQ-SPN-001/004): sınırlar yalnızca düşürülebilir; değişiklik denetim kaydına girer. */
export default async function SlotsPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string; hata?: string; alan?: string }>;
}) {
  const { token, user } = await requireStaff();
  const sp = await searchParams;
  if (!user.permissions.includes('campaigns.manage')) {
    return (
      <div className="max-w-2xl space-y-4">
        <PageTitle>{S.title}</PageTitle>
        <Alert kind="info">{tr.admin.noPermission}</Alert>
      </div>
    );
  }
  const { data } = await (await api(token)).GET('/v1/admin/placement-slots');
  return (
    <div className="max-w-3xl space-y-6 rounded-lg border border-border-default bg-bg-default p-6">
      <div className="space-y-1">
        <PageTitle>{S.title}</PageTitle>
        <p className="text-sm text-text-secondary">{S.intro}</p>
      </div>
      {sp.durum === 'kaydedildi' ? <Alert kind="success">{tr.admin.saved}</Alert> : null}
      {sp.hata ? (
        <Alert kind="error">{fieldMessage(sp.alan) ?? errorMessage(sp.hata)}</Alert>
      ) : null}
      <ul className="space-y-4">
        {data?.data.map((s) => (
          <li key={s.id} className="rounded-md border border-border-default p-4">
            <form
              action={updateSlotAction}
              aria-label={S.surfaces[s.surface]}
              className="space-y-3"
            >
              <h2 className="font-semibold">{S.surfaces[s.surface]}</h2>
              <p className="text-sm text-text-secondary">
                {S.cap.replace('{n}', String(s.cap.maxItems))}
              </p>
              <input type="hidden" name="id" value={s.id} />
              <input type="hidden" name="version" value={s.version} />
              <Field
                id={`positions-${s.id}`}
                name="positions"
                label={S.positions}
                defaultValue={s.positions.join(', ')}
              />
              <Field
                id={`max-${s.id}`}
                name="maxItems"
                type="number"
                label={S.maxItems}
                defaultValue={String(s.maxItems)}
              />
              <div className="flex items-center gap-2">
                <input
                  id={`enabled-${s.id}`}
                  name="enabled"
                  type="checkbox"
                  value="1"
                  defaultChecked={s.enabled}
                  className="h-5 w-5"
                />
                <label htmlFor={`enabled-${s.id}`} className="text-sm">
                  {S.enabled}
                </label>
              </div>
              <SubmitButton>{S.save}</SubmitButton>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
