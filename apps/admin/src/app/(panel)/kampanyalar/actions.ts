'use server';

import { redirect } from 'next/navigation';
import type { CampaignAction } from '@incelemeler/contracts';
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
/** `datetime-local` değeri Türkiye saatidir (UTC+3, yaz saati yok). */
function istanbul(v: string): string {
  return new Date(`${v}:00+03:00`).toISOString();
}
function lira(v: string): number | undefined {
  if (!v) return undefined;
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : undefined;
}
function failure(path: string, error: unknown): never {
  const first = (error as { errors?: Array<{ code?: string }> } | undefined)?.errors?.[0]?.code;
  const q = new URLSearchParams({ hata: problemCode(error) });
  if (first) q.set('alan', first);
  redirect(`${path}?${q.toString()}`);
}

export async function createOrganizationAction(form: FormData): Promise<void> {
  const { data, error } = await (
    await client()
  ).POST('/v1/admin/organizations', {
    body: {
      type: text(form, 'type') as 'ADVERTISER',
      name: text(form, 'name'),
    },
  });
  if (!data) failure('/kampanyalar', error);
  redirect('/kampanyalar?durum=kurulus');
}

export async function createCampaignAction(form: FormData): Promise<void> {
  const budget = lira(text(form, 'budget'));
  const { data, error } = await (
    await client()
  ).POST('/v1/admin/campaigns', {
    body: {
      name: text(form, 'name'),
      sponsorId: text(form, 'sponsorId'),
      startsAt: istanbul(text(form, 'startsAt')),
      endsAt: istanbul(text(form, 'endsAt')),
      contractRef: text(form, 'contractRef') || null,
      ...(budget !== undefined ? { budgetKurus: budget } : {}),
    },
  });
  if (!data) failure('/kampanyalar', error);
  redirect(`/kampanyalar/${data.id}?durum=olusturuldu`);
}

export async function transitionCampaignAction(form: FormData): Promise<void> {
  const id = text(form, 'id');
  const { data, error } = await (
    await client()
  ).POST('/v1/admin/campaigns/{id}/transition', {
    params: { path: { id } },
    body: {
      action: text(form, 'action') as CampaignAction,
      version: Number(text(form, 'version')),
    },
  });
  if (!data) failure(`/kampanyalar/${id}`, error);
  redirect(`/kampanyalar/${id}?durum=kaydedildi`);
}

export async function addPlacementAction(form: FormData): Promise<void> {
  const id = text(form, 'id');
  const { data, error } = await (
    await client()
  ).POST('/v1/admin/campaigns/{id}/placements', {
    params: { path: { id } },
    body: {
      slotId: text(form, 'slotId'),
      listingSlug: text(form, 'listingSlug'),
      targetCategorySlug: text(form, 'targetCategorySlug') || null,
      targetProvinceSlug: text(form, 'targetProvinceSlug') || null,
      priority: Number(text(form, 'priority') || 0),
      weight: Number(text(form, 'weight') || 1),
    },
  });
  if (!data) failure(`/kampanyalar/${id}`, error);
  redirect(`/kampanyalar/${id}?durum=kaydedildi`);
}

export async function removePlacementAction(form: FormData): Promise<void> {
  const id = text(form, 'id');
  const { data, error } = await (
    await client()
  ).DELETE('/v1/admin/campaign-placements/{id}', {
    params: { path: { id: text(form, 'placementId') } },
  });
  if (!data) failure(`/kampanyalar/${id}`, error);
  redirect(`/kampanyalar/${id}?durum=kaydedildi`);
}

export async function addCreativeAction(form: FormData): Promise<void> {
  const id = text(form, 'id');
  const { data, error } = await (
    await client()
  ).POST('/v1/admin/campaigns/{id}/creatives', {
    params: { path: { id } },
    body: { title: text(form, 'title'), body: text(form, 'body') || null },
  });
  if (!data) failure(`/kampanyalar/${id}`, error);
  redirect(`/kampanyalar/${id}?durum=kaydedildi`);
}

export async function reviewCreativeAction(form: FormData): Promise<void> {
  const id = text(form, 'id');
  const { data, error } = await (
    await client()
  ).POST('/v1/admin/creatives/{id}/review', {
    params: { path: { id: text(form, 'creativeId') } },
    body: {
      decision: text(form, 'decision') === 'APPROVED' ? 'APPROVED' : 'REJECTED',
      version: Number(text(form, 'version')),
    },
  });
  if (!data) failure(`/kampanyalar/${id}`, error);
  redirect(`/kampanyalar/${id}?durum=kaydedildi`);
}

export async function updateSlotAction(form: FormData): Promise<void> {
  const positions = text(form, 'positions')
    .split(',')
    .map((x) => Number.parseInt(x.trim(), 10))
    .filter((n) => Number.isInteger(n));
  const { data, error } = await (
    await client()
  ).PATCH('/v1/admin/placement-slots/{id}', {
    params: { path: { id: text(form, 'id') } },
    body: {
      positions,
      maxItems: Number(text(form, 'maxItems')),
      enabled: form.get('enabled') === '1',
      version: Number(text(form, 'version')),
    },
  });
  if (!data) failure('/ayarlar/yuvalar', error);
  redirect('/ayarlar/yuvalar?durum=kaydedildi');
}
