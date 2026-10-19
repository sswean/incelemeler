'use server';

import { redirect } from 'next/navigation';
import type { ProviderBody } from '@incelemeler/contracts';
import { problemCode } from '../../../lib/errors';
import { api, getSessionToken } from '../../../lib/session';

function text(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === 'string' ? v.trim() : '';
}
const list = (v: string) =>
  v
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

async function client() {
  const token = await getSessionToken();
  if (!token) redirect('/giris');
  return api(token);
}

export async function createProviderAction(form: FormData): Promise<void> {
  const { data, error } = await (
    await client()
  ).POST('/v1/admin/integration-providers', {
    body: {
      key: text(form, 'key'),
      name: text(form, 'name'),
      integrationStatus: text(form, 'integrationStatus') as ProviderBody['integrationStatus'],
      allowedDomains: list(text(form, 'allowedDomains')),
      termsUrl: text(form, 'termsUrl') || null,
      docsUrl: text(form, 'docsUrl') || null,
      credentialEnvNames: list(text(form, 'credentialEnvNames')),
    },
  });
  redirect(`/entegrasyonlar?${data ? 'durum=eklendi' : `hata=${problemCode(error)}`}`);
}

export async function updateProviderStatusAction(form: FormData): Promise<void> {
  const { data, error } = await (
    await client()
  ).PATCH('/v1/admin/integration-providers/{id}', {
    params: { path: { id: text(form, 'id') } },
    body: {
      integrationStatus: text(form, 'integrationStatus') as ProviderBody['integrationStatus'],
      version: Number.parseInt(text(form, 'version'), 10),
    },
  });
  redirect(`/entegrasyonlar?${data ? 'durum=kaydedildi' : `hata=${problemCode(error)}`}`);
}
