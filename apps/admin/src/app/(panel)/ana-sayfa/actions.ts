'use server';

import { redirect } from 'next/navigation';
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
const istanbul = (v: string) => (v ? new Date(`${v}:00+03:00`).toISOString() : null);

export async function updateHomeModuleAction(form: FormData): Promise<void> {
  const token = await getSessionToken();
  if (!token) redirect('/giris');
  const type = text(form, 'type');
  const config: Record<string, unknown> = {};
  if (type === 'CATEGORY_POPULAR' || type === 'SEASONAL') {
    if (text(form, 'categorySlug')) config['categorySlug'] = text(form, 'categorySlug');
  }
  if (type === 'EDITORS_PICKS') {
    config['listingSlugs'] = list(text(form, 'listingSlugs'));
    config['articleSlugs'] = list(text(form, 'articleSlugs'));
  }
  const { data, error } = await (
    await api(token)
  ).PATCH('/v1/admin/home-modules/{id}', {
    params: { path: { id: text(form, 'id') } },
    body: {
      title: text(form, 'title'),
      enabled: form.get('enabled') === '1',
      position: Number(text(form, 'position')),
      minItems: Number(text(form, 'minItems')),
      maxItems: Number(text(form, 'maxItems')),
      provinceSlug: text(form, 'provinceSlug') || null,
      visibleFrom: istanbul(text(form, 'visibleFrom')),
      visibleUntil: istanbul(text(form, 'visibleUntil')),
      ...(Object.keys(config).length ? { config } : {}),
      version: Number(text(form, 'version')),
    },
  });
  if (data) redirect('/ana-sayfa?durum=kaydedildi');
  const first = (error as { errors?: Array<{ code?: string }> } | undefined)?.errors?.[0]?.code;
  redirect(`/ana-sayfa?hata=${problemCode(error)}${first ? `&alan=${first}` : ''}`);
}
