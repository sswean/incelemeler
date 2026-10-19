'use server';

import { redirect } from 'next/navigation';
import type { DataRequestType } from '@incelemeler/contracts';
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

export async function updateDataRequestAction(form: FormData): Promise<void> {
  const reason = text(form, 'rejectionReason');
  const { data, error } = await (
    await client()
  ).PATCH('/v1/admin/data-requests/{id}', {
    params: { path: { id: text(form, 'id') } },
    body: {
      status: text(form, 'status') as 'RECEIVED',
      responseNote: text(form, 'responseNote') || null,
      rejectionReason: (reason || null) as null,
      version: Number(text(form, 'version')),
    },
  });
  redirect(`/kvkk-basvurulari?${data ? 'durum=kaydedildi' : `hata=${problemCode(error)}`}`);
}

export async function createDataRequestAction(form: FormData): Promise<void> {
  const received = text(form, 'receivedAt');
  const { data, error } = await (
    await client()
  ).POST('/v1/admin/data-requests', {
    body: {
      type: text(form, 'type') as DataRequestType,
      email: text(form, 'email'),
      description: text(form, 'description'),
      ...(received ? { receivedAt: new Date(`${received}:00+03:00`).toISOString() } : {}),
    },
  });
  redirect(`/kvkk-basvurulari?${data ? 'durum=olusturuldu' : `hata=${problemCode(error)}`}`);
}
