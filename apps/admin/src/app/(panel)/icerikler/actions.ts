'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ArticleStatus, ArticleType, type ArticleUpdateBody } from '@incelemeler/contracts';
import { problemCode } from '../../../lib/errors';
import { api, getSessionToken } from '../../../lib/session';
import { fieldErrorsOf } from '../kategoriler/field-errors';

export type ArticleFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function text(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === 'string' ? v.trim() : '';
}
async function client() {
  const token = await getSessionToken();
  if (!token) redirect('/giris');
  return api(token);
}

export async function createArticleAction(form: FormData): Promise<void> {
  const type = ArticleType.safeParse(text(form, 'type'));
  if (!type.success) redirect('/icerikler/yeni?hata=VALIDATION_FAILED');
  const { data, error } = await (
    await client()
  ).POST('/v1/admin/articles', { body: { type: type.data, title: text(form, 'title') } });
  if (!data) redirect(`/icerikler/yeni?hata=${problemCode(error)}`);
  redirect(`/icerikler/${data.id}`);
}

/** Editörden gelen yük (JSON) API'ye iletilir; doğrulama API'de (zod + kurallar). */
export async function saveArticleAction(
  _prev: ArticleFormState,
  form: FormData,
): Promise<ArticleFormState> {
  const id = text(form, 'id');
  let payload: ArticleUpdateBody;
  try {
    payload = JSON.parse(text(form, 'payload')) as ArticleUpdateBody;
  } catch {
    return { error: 'VALIDATION_FAILED' };
  }
  const { data, error } = await (
    await client()
  ).PATCH('/v1/admin/articles/{id}', { params: { path: { id } }, body: payload });
  if (!data) return { error: problemCode(error), fieldErrors: fieldErrorsOf(error, true) };
  // Kayıttan sonra sürüm değişir ve editör yeniden kurulur; başarı iletisini sayfa gösterir.
  revalidatePath(`/icerikler/${id}`);
  redirect(`/icerikler/${id}?durum=kaydedildi`);
}

export async function transitionArticleAction(form: FormData): Promise<void> {
  const id = text(form, 'id');
  const to = ArticleStatus.parse(text(form, 'to'));
  const local = text(form, 'scheduledAt');
  const { data, error } = await (
    await client()
  ).POST('/v1/admin/articles/{id}/transition', {
    params: { path: { id } },
    body: {
      version: Number.parseInt(text(form, 'version'), 10),
      to,
      // Arayüzde Europe/Istanbul (UTC+3, yaz saati yok) yerel saati; UTC'ye çevrilir.
      ...(local ? { scheduledAt: new Date(`${local}:00+03:00`).toISOString() } : {}),
    },
  });
  if (!data) {
    const code = (error as { errors?: Array<{ code: string }> } | undefined)?.errors?.[0]?.code;
    redirect(`/icerikler/${id}?hata=${code ?? problemCode(error)}`);
  }
  redirect(`/icerikler/${id}?durum=kaydedildi`);
}

export async function correctionAction(form: FormData): Promise<void> {
  const id = text(form, 'id');
  const { data, error } = await (
    await client()
  ).POST('/v1/admin/articles/{id}/corrections', {
    params: { path: { id } },
    body: { version: Number.parseInt(text(form, 'version'), 10), note: text(form, 'note') },
  });
  redirect(`/icerikler/${id}?${data ? 'durum=kaydedildi' : `hata=${problemCode(error)}`}`);
}

export async function previewAction(
  _prev: { url?: string; error?: string },
  form: FormData,
): Promise<{ url?: string; error?: string }> {
  const { data, error } = await (
    await client()
  ).POST('/v1/admin/articles/{id}/preview', { params: { path: { id: text(form, 'id') } } });
  return data ? { url: data.url } : { error: problemCode(error) };
}

/** Blok editöründen görsel yükleme; görsel kimliği döner (lisans bilgileri medya sayfasında). */
export async function uploadInlineMediaAction(
  form: FormData,
): Promise<{ id?: string; error?: string }> {
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'VALIDATION_FAILED' };
  const fd = new FormData();
  fd.set('file', file, file.name);
  const alt = text(form, 'altText');
  if (alt) fd.set('altText', alt);
  const { data, error } = await (
    await client()
  ).POST('/v1/admin/media', { body: { file: '' }, bodySerializer: () => fd });
  return data ? { id: data.id } : { error: problemCode(error) };
}

export async function searchListingsAction(
  q: string,
): Promise<Array<{ id: string; name: string; kind: string; status: string }>> {
  const term = q.trim();
  if (term.length < 2) return [];
  const { data } = await (
    await client()
  ).GET('/v1/admin/listings', { params: { query: { q: term.slice(0, 100), limit: 10 } } });
  return (data?.data ?? []).map((l) => ({
    id: l.id,
    name: l.name,
    kind: l.kind,
    status: l.status,
  }));
}
