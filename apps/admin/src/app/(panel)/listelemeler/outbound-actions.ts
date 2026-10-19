'use server';

import { redirect } from 'next/navigation';
import type { OutboundLinkCreateBody } from '@incelemeler/contracts';
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
/** İlk alan hatası kodu (ör. `domain_not_allowed`) ayrıca iletilir; panel alan düzeyinde mesaj gösterir. */
function failure(listingId: string, error: unknown): never {
  const first = (error as { errors?: Array<{ code?: string }> } | undefined)?.errors?.[0]?.code;
  const q = new URLSearchParams({ hata: problemCode(error) });
  if (first) q.set('baglanti', first);
  redirect(`/listelemeler/${listingId}?${q.toString()}#dis-baglantilar`);
}

export async function createOutboundLinkAction(form: FormData): Promise<void> {
  const listingId = text(form, 'listingId');
  const until = text(form, 'validUntil');
  const { data, error } = await (
    await client()
  ).POST('/v1/admin/outbound-links', {
    body: {
      listingId,
      providerId: text(form, 'providerId') || null,
      kind: text(form, 'kind') as OutboundLinkCreateBody['kind'],
      ctaType: text(form, 'ctaType') as OutboundLinkCreateBody['ctaType'],
      commercialRelation: text(
        form,
        'commercialRelation',
      ) as OutboundLinkCreateBody['commercialRelation'],
      urlTemplate: text(form, 'urlTemplate'),
      label: text(form, 'label') || null,
      validUntil: until ? new Date(`${until}T23:59:59+03:00`).toISOString() : null,
    },
  });
  if (!data) failure(listingId, error);
  redirect(`/listelemeler/${listingId}?durum=baglanti-eklendi#dis-baglantilar`);
}

export async function setOutboundStatusAction(form: FormData): Promise<void> {
  const listingId = text(form, 'listingId');
  const { data, error } = await (
    await client()
  ).PATCH('/v1/admin/outbound-links/{id}', {
    params: { path: { id: text(form, 'id') } },
    body: {
      status: text(form, 'status') === 'ACTIVE' ? 'ACTIVE' : 'DISABLED',
      version: Number.parseInt(text(form, 'version'), 10),
    },
  });
  if (!data) failure(listingId, error);
  redirect(`/listelemeler/${listingId}?durum=baglanti-guncellendi#dis-baglantilar`);
}

export async function checkOutboundLinkAction(form: FormData): Promise<void> {
  const listingId = text(form, 'listingId');
  const { data, error } = await (
    await client()
  ).POST('/v1/admin/outbound-links/{id}/check', { params: { path: { id: text(form, 'id') } } });
  if (!data) failure(listingId, error);
  redirect(`/listelemeler/${listingId}?durum=baglanti-denetlendi#dis-baglantilar`);
}
