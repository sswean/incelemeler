'use server';

import { redirect } from 'next/navigation';
import type { ReviewBody } from '@incelemeler/contracts';
import { problemCode } from '../../lib/errors';
import { api, getSessionToken } from '../../lib/session';

export type ReviewFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  needsLogin?: boolean;
};

function fieldErrors(error: unknown): Record<string, string> {
  const errs =
    (error as { errors?: Array<{ pointer: string; code: string }> } | undefined)?.errors ?? [];
  return Object.fromEntries(
    errs.map((e) => [e.pointer.replace(/^\/(body\/)?/, '').split('/')[0]!, e.code]),
  );
}

/**
 * Değerlendirme gönderimi (A6.4): oturum yoksa giriş istenir; taslak istemcide korunur ve
 * girişten sonra eksiksiz geri yüklenir. JSON yükü API'de doğrulanır (zod + tür kuralları).
 */
export async function submitReviewAction(
  _prev: ReviewFormState,
  form: FormData,
): Promise<ReviewFormState> {
  const token = await getSessionToken();
  if (!token) return { needsLogin: true };
  let payload: ReviewBody & { listingId: string; reviewId?: string; version?: number };
  try {
    payload = JSON.parse(String(form.get('payload') ?? ''));
  } catch {
    return { error: 'VALIDATION_FAILED' };
  }
  const client = await api(token);
  const { reviewId, version, listingId, ...body } = payload;
  const { data, error } = reviewId
    ? await client.PATCH('/v1/reviews/{id}', {
        params: { path: { id: reviewId } },
        body: { ...body, version: version ?? 0 },
      })
    : await client.POST('/v1/reviews', { body: { ...body, listingId } });
  if (!data) return { error: problemCode(error), fieldErrors: fieldErrors(error) };
  redirect('/hesabim/degerlendirmelerim?durum=gonderildi');
}

/** Üye taslağı hesaba otomatik kaydedilir (misafirde yalnızca cihazda). */
export async function saveDraftAction(
  listingId: string,
  data: Record<string, unknown>,
): Promise<boolean> {
  const token = await getSessionToken();
  if (!token) return false;
  const { data: saved } = await (
    await api(token)
  ).PUT('/v1/me/review-drafts/{listingId}', {
    params: { path: { listingId } },
    body: { data },
  });
  return Boolean(saved);
}

export async function reportAction(
  _prev: { ok?: boolean; error?: string },
  form: FormData,
): Promise<{ ok?: boolean; error?: string }> {
  const token = await getSessionToken();
  const email = String(form.get('email') ?? '').trim();
  const description = String(form.get('description') ?? '').trim();
  const { data, error } = await (
    await api(token)
  ).POST('/v1/reports', {
    body: {
      targetType: 'REVIEW',
      targetId: String(form.get('targetId') ?? ''),
      reason: String(form.get('reason') ?? '') as never,
      description: description || null,
      ...(token || !email ? {} : { email }),
    },
  });
  return data ? { ok: true } : { error: problemCode(error) };
}

export async function withdrawReviewAction(form: FormData): Promise<void> {
  const token = await getSessionToken();
  if (!token) redirect('/giris?sonra=/hesabim/degerlendirmelerim');
  const { data, error } = await (
    await api(token)
  ).DELETE('/v1/reviews/{id}', {
    params: { path: { id: String(form.get('id') ?? '') } },
  });
  redirect(
    `/hesabim/degerlendirmelerim?${data ? 'durum=geri-cekildi' : `hata=${problemCode(error)}`}`,
  );
}

export async function appealAction(form: FormData): Promise<void> {
  const token = await getSessionToken();
  if (!token) redirect('/giris?sonra=/hesabim/degerlendirmelerim');
  const { data, error } = await (
    await api(token)
  ).POST('/v1/appeals', {
    body: {
      reviewId: String(form.get('reviewId') ?? ''),
      statement: String(form.get('statement') ?? ''),
    },
  });
  redirect(`/hesabim/degerlendirmelerim?${data ? 'durum=itiraz' : `hata=${problemCode(error)}`}`);
}
