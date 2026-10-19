'use server';

import { redirect } from 'next/navigation';
import { ListingKind } from '@incelemeler/contracts';
import { problemCode } from '../../../lib/errors';
import { api, getSessionToken } from '../../../lib/session';

export type ImportFormState = { error?: string; fieldCode?: string };

function text(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === 'string' ? v.trim() : '';
}
async function client() {
  const token = await getSessionToken();
  if (!token) redirect('/giris');
  return api(token);
}

/** UTF-8 değilse Türkçe Excel'in varsayılanı Windows-1254 olarak çözülür. */
function decode(bytes: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder('windows-1254').decode(bytes);
  }
}

export async function previewImportAction(
  _prev: ImportFormState,
  form: FormData,
): Promise<ImportFormState> {
  const file = form.get('file');
  const kind = ListingKind.safeParse(text(form, 'kind'));
  if (!(file instanceof File) || file.size === 0 || !kind.success) {
    return { error: 'VALIDATION_FAILED' };
  }
  const { data, error } = await (
    await client()
  ).POST('/v1/admin/imports', {
    body: {
      kind: kind.data,
      primaryCategoryId: text(form, 'primaryCategoryId'),
      source: text(form, 'source'),
      fileName: file.name.slice(0, 200),
      csv: decode(await file.arrayBuffer()),
    },
  });
  if (!data) {
    const code = (error as { errors?: Array<{ code: string }> } | undefined)?.errors?.[0]?.code;
    return { error: problemCode(error), fieldCode: code };
  }
  redirect(`/ice-aktarma/${data.id}`);
}

export async function importCommandAction(form: FormData): Promise<void> {
  const id = text(form, 'id');
  const command = text(form, 'command') === 'rollback' ? 'rollback' : 'commit';
  const c = await client();
  const { data, error } =
    command === 'commit'
      ? await c.POST('/v1/admin/imports/{id}/commit', { params: { path: { id } } })
      : await c.POST('/v1/admin/imports/{id}/rollback', { params: { path: { id } } });
  if (!data) {
    const code = (error as { errors?: Array<{ code: string }> } | undefined)?.errors?.[0]?.code;
    redirect(`/ice-aktarma/${id}?hata=${code ?? problemCode(error)}`);
  }
  redirect(`/ice-aktarma/${id}?durum=kaydedildi`);
}
