'use server';

import { redirect } from 'next/navigation';
import { problemCode } from '../../../lib/errors';
import { api, getSessionToken } from '../../../lib/session';

function text(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

/** Moderasyon kararı (REQ-GUN-001): ret/kaldırmada gerekçe kodu zorunlu; API denetim kaydı tutar. */
export async function decideAction(form: FormData): Promise<void> {
  const token = await getSessionToken();
  if (!token) redirect('/giris');
  const client = await api(token);
  const kind = text(form, 'kind');
  const id = text(form, 'id');
  const queue = text(form, 'queue') || 'pending';
  const reasonCode = text(form, 'reasonCode') || undefined;
  const note = text(form, 'note') || null;
  const action = text(form, 'action');
  const res =
    kind === 'REVIEW'
      ? await client.POST('/v1/admin/moderation/reviews/{id}/decision', {
          params: { path: { id } },
          body: {
            action: action as 'APPROVE' | 'REJECT' | 'REMOVE',
            reasonCode: reasonCode as never,
            note,
            version: Number(text(form, 'version')),
          },
        })
      : kind === 'REPORT'
        ? await client.POST('/v1/admin/moderation/reports/{id}/decision', {
            params: { path: { id } },
            body: {
              action: action as 'DISMISS' | 'REMOVE_TARGET',
              reasonCode: reasonCode as never,
              note,
            },
          })
        : await client.POST('/v1/admin/moderation/appeals/{id}/decision', {
            params: { path: { id } },
            body: {
              outcome: action as 'UPHELD' | 'OVERTURNED',
              reasonCode: reasonCode as never,
              note: note ?? '',
            },
          });
  redirect(
    `/moderasyon?kuyruk=${queue}&${res.data ? 'durum=karar' : `hata=${problemCode(res.error)}`}`,
  );
}
