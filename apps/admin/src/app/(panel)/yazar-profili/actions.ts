'use server';

import { redirect } from 'next/navigation';
import { problemCode } from '../../../lib/errors';
import { api, getSessionToken } from '../../../lib/session';

function text(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === 'string' ? v.trim() : '';
}
const orNull = (v: string) => (v ? v : null);

/** Satır biçimi: "Etiket | https://…"; biçimsiz satır varsa null. */
function parseLinks(raw: string): Array<{ label: string; url: string }> | null {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const out: Array<{ label: string; url: string }> = [];
  for (const line of lines) {
    const i = line.lastIndexOf('|');
    if (i < 0) return null;
    out.push({ label: line.slice(0, i).trim(), url: line.slice(i + 1).trim() });
  }
  return out;
}

export async function saveAuthorProfileAction(form: FormData): Promise<void> {
  const token = await getSessionToken();
  if (!token) redirect('/giris');
  const links = parseLinks(text(form, 'links'));
  if (!links) redirect('/yazar-profili?hata=links_format');
  const version = text(form, 'version');
  const { data, error } = await (
    await api(token)
  ).PUT('/v1/admin/author-profile', {
    body: {
      slug: text(form, 'slug'),
      title: orNull(text(form, 'jobTitle')),
      bio: orNull(text(form, 'bio')),
      expertise: text(form, 'expertise')
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean),
      ethics: orNull(text(form, 'ethics')),
      links,
      ...(version ? { version: Number.parseInt(version, 10) } : {}),
    },
  });
  if (!data) {
    const code = (error as { errors?: Array<{ code: string }> } | undefined)?.errors?.[0]?.code;
    redirect(`/yazar-profili?hata=${code ?? problemCode(error)}`);
  }
  redirect('/yazar-profili?durum=kaydedildi');
}
