'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { AttributeType } from '@incelemeler/contracts';
import { slugifyTr } from '@incelemeler/utils';
import { problemCode } from '../../../lib/errors';
import { api, getSessionToken } from '../../../lib/session';
import { fieldErrorsOf } from './field-errors';
import type { CategoryFormState } from './actions';

function text(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === 'string' ? v.trim() : '';
}
function num(form: FormData, key: string): number | undefined {
  const raw = text(form, key).replace(',', '.');
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}
async function client() {
  const token = await getSessionToken();
  if (!token) redirect('/giris');
  return api(token);
}

/** Özellik ekler (REQ-VER-003). Seçenek değerleri etiketten üretilir. */
export async function addAttributeAction(
  _prev: CategoryFormState,
  form: FormData,
): Promise<CategoryFormState> {
  const id = text(form, 'categoryId');
  const type = AttributeType.safeParse(text(form, 'type'));
  if (!type.success) return { error: 'VALIDATION_FAILED', fieldErrors: { type: 'invalid' } };
  const options = text(form, 'options')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((label) => ({ value: slugifyTr(label), label }));
  const min = num(form, 'min');
  const max = num(form, 'max');
  const maxLength = num(form, 'maxLength');
  const unit = text(form, 'unit');
  const { error, response } = await (
    await client()
  ).POST('/v1/admin/categories/{id}/attributes', {
    params: { path: { id } },
    body: {
      key: text(form, 'key'),
      label: text(form, 'label'),
      type: type.data,
      ...(options.length ? { options } : {}),
      ...(unit ? { unit } : {}),
      validation: {
        ...(min !== undefined ? { min } : {}),
        ...(max !== undefined ? { max } : {}),
        ...(maxLength !== undefined ? { maxLength } : {}),
      },
      filterable: form.get('filterable') === '1',
      showOnCard: form.get('showOnCard') === '1',
      required: form.get('required') === '1',
    },
  });
  if (response.status !== 201)
    return { error: problemCode(error), fieldErrors: fieldErrorsOf(error) };
  revalidatePath(`/kategoriler/${id}`);
  return {};
}

export async function archiveAttributeAction(form: FormData): Promise<void> {
  const id = text(form, 'categoryId');
  await (
    await client()
  ).DELETE('/v1/admin/categories/{id}/attributes/{attributeId}', {
    params: { path: { id, attributeId: text(form, 'attributeId') } },
  });
  revalidatePath(`/kategoriler/${id}`);
}

export async function addCriterionAction(
  _prev: CategoryFormState,
  form: FormData,
): Promise<CategoryFormState> {
  const id = text(form, 'categoryId');
  const description = text(form, 'description');
  const { error, response } = await (
    await client()
  ).POST('/v1/admin/categories/{id}/criteria', {
    params: { path: { id } },
    body: { name: text(form, 'name'), ...(description ? { description } : {}) },
  });
  if (response.status !== 201)
    return { error: problemCode(error), fieldErrors: fieldErrorsOf(error) };
  revalidatePath(`/kategoriler/${id}`);
  return {};
}

export async function archiveCriterionAction(form: FormData): Promise<void> {
  const id = text(form, 'categoryId');
  await (
    await client()
  ).DELETE('/v1/admin/categories/{id}/criteria/{criterionId}', {
    params: { path: { id, criterionId: text(form, 'criterionId') } },
  });
  revalidatePath(`/kategoriler/${id}`);
}
