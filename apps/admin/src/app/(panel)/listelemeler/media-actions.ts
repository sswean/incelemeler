'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { ListingMediaItem } from '@incelemeler/contracts';
import { problemCode } from '../../../lib/errors';
import { api, getSessionToken } from '../../../lib/session';

export type MediaFormState = { error?: string };

function text(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === 'string' ? v.trim() : '';
}
async function client() {
  const token = await getSessionToken();
  if (!token) redirect('/giris');
  return api(token);
}

async function currentMedia(id: string) {
  const { data } = await (
    await client()
  ).GET('/v1/admin/listings/{id}', { params: { path: { id } } });
  if (!data) redirect('/listelemeler');
  return data;
}

async function saveMedia(id: string, version: number, media: ListingMediaItem[]) {
  const { data, error } = await (
    await client()
  ).PATCH('/v1/admin/listings/{id}', { params: { path: { id } }, body: { version, media } });
  return data ? null : problemCode(error);
}

/** Görseli yükler (API: tür doğrulama, EXIF silme) ve listelemeye ekler; ilk görsel kapak olur. */
export async function uploadListingMediaAction(
  _prev: MediaFormState,
  form: FormData,
): Promise<MediaFormState> {
  const listingId = text(form, 'listingId');
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'VALIDATION_FAILED' };
  const fd = new FormData();
  fd.set('file', file, file.name);
  const alt = text(form, 'altText');
  if (alt) fd.set('altText', alt);
  const { data, error } = await (
    await client()
  ).POST('/v1/admin/media', {
    body: { file: '' },
    bodySerializer: () => fd,
  });
  if (!data) return { error: problemCode(error) };
  const listing = await currentMedia(listingId);
  const items = listing.media.map((m) => ({ mediaId: m.mediaId, role: m.role }));
  items.push({
    mediaId: data.id,
    role: items.some((m) => m.role === 'PRIMARY') ? 'GALLERY' : 'PRIMARY',
  });
  const err = await saveMedia(listingId, listing.version, items);
  if (err) return { error: err };
  revalidatePath(`/listelemeler/${listingId}`);
  return {};
}

export async function listingMediaCommandAction(form: FormData): Promise<void> {
  const listingId = text(form, 'listingId');
  const mediaId = text(form, 'mediaId');
  const command = text(form, 'command');
  const listing = await currentMedia(listingId);
  let items: ListingMediaItem[] = listing.media.map((m) => ({ mediaId: m.mediaId, role: m.role }));
  if (command === 'remove') {
    items = items.filter((m) => m.mediaId !== mediaId);
  } else if (command === 'primary') {
    items = items.map((m) => ({ ...m, role: m.mediaId === mediaId ? 'PRIMARY' : 'GALLERY' }));
  }
  const err = await saveMedia(listingId, listing.version, items);
  redirect(`/listelemeler/${listingId}${err ? `?hata=${err}` : '?durum=kaydedildi'}`);
}
