'use server';

import { redirect } from 'next/navigation';
import {
  type AttributeDefinition,
  ListingKind,
  ListingStatus,
  type ListingUpdateBody,
} from '@incelemeler/contracts';
import { problemCode } from '../../../lib/errors';
import { api, getSessionToken } from '../../../lib/session';
import { fieldErrorsOf } from '../kategoriler/field-errors';

export type ListingFormState = { error?: string; fieldErrors?: Record<string, string> };

function text(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === 'string' ? v.trim() : '';
}
const orNull = (v: string) => (v ? v : null);
function number(v: string): number | null {
  if (!v) return null;
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}
async function client() {
  const token = await getSessionToken();
  if (!token) redirect('/giris');
  return api(token);
}

export async function createListingAction(
  _prev: ListingFormState,
  form: FormData,
): Promise<ListingFormState> {
  const kind = ListingKind.safeParse(text(form, 'kind'));
  if (!kind.success) return { error: 'VALIDATION_FAILED', fieldErrors: { kind: 'invalid' } };
  const { data, error } = await (
    await client()
  ).POST('/v1/admin/listings', {
    body: {
      kind: kind.data,
      name: text(form, 'name'),
      primaryCategoryId: text(form, 'primaryCategoryId'),
      source: text(form, 'source'),
      dataOrigin: text(form, 'dataOrigin') === 'DEMO' ? 'DEMO' : 'EDITORIAL',
    },
  });
  if (!data) return { error: problemCode(error), fieldErrors: fieldErrorsOf(error) };
  redirect(`/listelemeler/${data.id}?durum=olusturuldu`);
}

/** Özellik değerlerini şema tipine göre çevirir; boş alan "belirtilmedi" demektir (REQ-LST-002). */
function attributesFrom(form: FormData, defs: AttributeDefinition[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const d of defs) {
    const name = `attr.${d.key}`;
    if (d.type === 'MULTI_ENUM') {
      const values = form.getAll(name).filter((v): v is string => typeof v === 'string' && !!v);
      if (values.length) out[d.key] = values;
      continue;
    }
    const raw = text(form, name);
    if (!raw) continue;
    if (d.type === 'BOOL') out[d.key] = raw === 'true';
    else if (d.type === 'INT' || d.type === 'DECIMAL') out[d.key] = number(raw) ?? raw;
    else out[d.key] = raw;
  }
  return out;
}

export async function saveListingAction(
  _prev: ListingFormState,
  form: FormData,
): Promise<ListingFormState> {
  const c = await client();
  const id = text(form, 'id');
  const kind = ListingKind.parse(text(form, 'kind'));
  const { data: schema } = await c.GET('/v1/admin/categories/{id}/schema', {
    params: { path: { id: text(form, 'primaryCategoryId') } },
  });
  const provinceId = text(form, 'provinceId');
  const contacts = Object.fromEntries(
    (['phone', 'website', 'email', 'reservationUrl'] as const)
      .map((k) => [k, text(form, `contact.${k}`)])
      .filter(([, v]) => v),
  );
  const paragraphs = text(form, 'description')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const priceLevel = number(text(form, 'priceLevel'));
  const date = (v: string) => (v ? new Date(v).toISOString() : null);

  const details: ListingUpdateBody['details'] = {};
  if (kind === 'LODGING') {
    details.lodging = {
      tourismLicenseNo: orNull(text(form, 'd.tourismLicenseNo')),
      checkInTime: orNull(text(form, 'd.checkInTime')),
      checkOutTime: orNull(text(form, 'd.checkOutTime')),
    };
  } else if (kind === 'PRODUCT' && (text(form, 'd.brand') || text(form, 'd.model'))) {
    details.product = {
      brand: text(form, 'd.brand'),
      model: text(form, 'd.model'),
      gtin: orNull(text(form, 'd.gtin')),
      releaseDate: orNull(text(form, 'd.releaseDate')),
    };
  } else if (kind === 'EXPERIENCE') {
    details.experience = {
      durationMinutes: number(text(form, 'd.durationMinutes')),
      startPoint: orNull(text(form, 'd.startPoint')),
    };
  } else if (kind === 'EVENT') {
    details.event = {
      startsAt: date(text(form, 'd.startsAt')),
      endsAt: date(text(form, 'd.endsAt')),
    };
  } else if (kind === 'GUIDE_PERSON') {
    details.guide = {
      languages: text(form, 'd.languages')
        .split(',')
        .map((l) => l.trim().toLowerCase())
        .filter(Boolean),
    };
  }

  const body: ListingUpdateBody = {
    version: Number.parseInt(text(form, 'version'), 10),
    name: text(form, 'name'),
    slug: text(form, 'slug'),
    shortDescription: orNull(text(form, 'shortDescription')),
    description: paragraphs.length ? paragraphs.map((t) => ({ type: 'paragraph', text: t })) : null,
    priceLevel: priceLevel && priceLevel >= 1 && priceLevel <= 4 ? priceLevel : null,
    contacts,
    location: provinceId
      ? {
          provinceId,
          districtId: orNull(text(form, 'districtId')),
          neighborhood: orNull(text(form, 'neighborhood')),
          addressLine: orNull(text(form, 'addressLine')),
          postalCode: orNull(text(form, 'postalCode')),
          latitude: number(text(form, 'latitude')),
          longitude: number(text(form, 'longitude')),
        }
      : null,
    attributes: attributesFrom(form, schema?.attributes ?? []),
    details,
    source: text(form, 'source'),
    sourceVerifiedAt: text(form, 'sourceVerifiedAt')
      ? `${text(form, 'sourceVerifiedAt')}T00:00:00.000Z`
      : null,
  };
  const { data, error } = await c.PATCH('/v1/admin/listings/{id}', {
    params: { path: { id } },
    body,
  });
  if (!data) return { error: problemCode(error), fieldErrors: fieldErrorsOf(error, true) };
  redirect(`/listelemeler/${id}?durum=kaydedildi`);
}

export async function setListingStatusAction(form: FormData): Promise<void> {
  const id = text(form, 'id');
  const status = ListingStatus.parse(text(form, 'status'));
  const { data, error } = await (
    await client()
  ).POST('/v1/admin/listings/{id}/status', {
    params: { path: { id } },
    body: { version: Number.parseInt(text(form, 'version'), 10), status },
  });
  if (!data) redirect(`/listelemeler/${id}?hata=${problemCode(error)}`);
  redirect(`/listelemeler/${id}?durum=kaydedildi`);
}
