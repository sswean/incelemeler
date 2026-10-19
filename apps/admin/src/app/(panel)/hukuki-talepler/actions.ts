'use server';

import { redirect } from 'next/navigation';
import { problemCode } from '../../../lib/errors';
import { api, getSessionToken } from '../../../lib/session';

function text(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === 'string' ? v.trim() : '';
}
async function client() {
  const token = await getSessionToken();
  if (!token) redirect('/giris');
  return api(token);
}

/** Hukuki talep kararı (REQ-GUN-005). */
export async function updateTakedownAction(form: FormData): Promise<void> {
  const status = text(form, 'status') as 'IN_REVIEW';
  const targetType = text(form, 'targetType');
  const targetId = text(form, 'targetId');
  const reason = text(form, 'rejectionReason');
  const note = text(form, 'decisionNote');
  const { data, error } = await (
    await client()
  ).PATCH('/v1/admin/takedown-requests/{id}', {
    params: { path: { id: text(form, 'id') } },
    body: {
      version: Number(text(form, 'version')),
      status,
      ...(targetType ? { targetType: targetType as 'review' } : {}),
      ...(targetId ? { targetId } : {}),
      removeTarget: form.get('removeTarget') === '1',
      ...(reason ? { rejectionReason: reason as 'NOT_UNLAWFUL' } : {}),
      ...(note ? { decisionNote: note } : {}),
    },
  });
  redirect(`/hukuki-talepler?${data ? 'durum=kaydedildi' : `hata=${problemCode(error)}`}`);
}

/** Elle kayıt; mahkeme/idari kararlar yalnızca burada, karar referansıyla. */
export async function createTakedownAction(form: FormData): Promise<void> {
  const org = text(form, 'requesterOrg');
  const ref = text(form, 'authorityReference');
  const received = text(form, 'receivedAt');
  const { data, error } = await (
    await client()
  ).POST('/v1/admin/takedown-requests', {
    body: {
      kind: text(form, 'kind') as 'COURT_ORDER',
      requesterName: text(form, 'requesterName'),
      ...(org ? { requesterOrg: org } : {}),
      requesterEmail: text(form, 'requesterEmail'),
      requesterCapacity: text(form, 'requesterCapacity') as 'AUTHORITY',
      legalBasis: text(form, 'legalBasis'),
      targetUrl: text(form, 'targetUrl'),
      ...(ref ? { authorityReference: ref } : {}),
      ...(received ? { receivedAt: new Date(`${received}:00+03:00`).toISOString() } : {}),
    },
  });
  redirect(`/hukuki-talepler?${data ? 'durum=olusturuldu' : `hata=${problemCode(error)}`}`);
}
