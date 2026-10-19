'use server';

import { redirect } from 'next/navigation';
import { ListingKind } from '@incelemeler/contracts';
import { problemCode } from '../../../lib/errors';
import { api, getSessionToken } from '../../../lib/session';
import { fieldErrorsOf } from './field-errors';

export type CategoryFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

const FLAGS = [
  'ymyl',
  'requiresExpertReview',
  'ugcEnabled',
  'sponsorshipAllowed',
  'requiresLicense',
] as const;
const STATUSES = ['DRAFT', 'HIDDEN', 'PUBLISHED'] as const;

function text(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

/** Kategori oluşturma/güncelleme (REQ-KAT-001). Yetki ve kurallar API'de denetlenir. */
export async function saveCategoryAction(
  _prev: CategoryFormState,
  form: FormData,
): Promise<CategoryFormState> {
  const token = await getSessionToken();
  if (!token) redirect('/giris');
  const client = await api(token);
  const id = text(form, 'id');
  const kinds = form
    .getAll('allowedKinds')
    .filter((k): k is ListingKind => ListingKind.safeParse(k).success);
  const flags = Object.fromEntries(FLAGS.map((f) => [f, form.get(f) === '1'])) as Record<
    (typeof FLAGS)[number],
    boolean
  >;
  const slug = text(form, 'slug');
  const sortOrder = Number.parseInt(text(form, 'sortOrder') || '0', 10);

  if (!id) {
    const parentId = text(form, 'parentId');
    const { data, error } = await client.POST('/v1/admin/categories', {
      body: {
        name: text(form, 'name'),
        ...(slug ? { slug } : {}),
        parentId: parentId || null,
        allowedKinds: kinds,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
        ...flags,
      },
    });
    if (!data) return { error: problemCode(error), fieldErrors: fieldErrorsOf(error) };
    redirect(`/kategoriler/${data.id}?durum=kaydedildi`);
  }

  const status = STATUSES.find((s) => s === text(form, 'status'));
  const { data, error } = await client.PATCH('/v1/admin/categories/{id}', {
    params: { path: { id } },
    body: {
      version: Number.parseInt(text(form, 'version'), 10),
      name: text(form, 'name'),
      ...(slug ? { slug } : {}),
      allowedKinds: kinds,
      ...(status ? { status } : {}),
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      ...flags,
    },
  });
  if (!data) return { error: problemCode(error), fieldErrors: fieldErrorsOf(error) };
  redirect(`/kategoriler/${data.id}?durum=kaydedildi`);
}
