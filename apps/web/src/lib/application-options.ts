import 'server-only';
import { compareTr } from '@incelemeler/utils';
import { api } from './session';

/** Başvuru formları için yayındaki kategoriler ve iller (sayfa başına 100, en fazla 10 sayfa). */
export async function applicationOptions() {
  const client = await api();
  const categories: Array<{ id: string; name: string; allowedKinds: string[] }> = [];
  let cursor: string | undefined;
  for (let i = 0; i < 10; i++) {
    const { data } = await client.GET('/v1/categories', {
      params: { query: { limit: 100, ...(cursor ? { cursor } : {}) } },
    });
    if (!data) break;
    categories.push(
      ...data.data.map((c) => ({ id: c.id, name: c.name, allowedKinds: c.allowedKinds })),
    );
    if (!data.page.nextCursor) break;
    cursor = data.page.nextCursor;
  }
  const { data: areas } = await client.GET('/v1/admin-areas', {
    params: { query: { level: 'PROVINCE' } },
  });
  return {
    categories: categories.sort((a, b) => compareTr(a.name, b.name)),
    provinces: (areas?.data ?? [])
      .map((p) => ({ id: p.id, name: p.name }))
      .sort((a, b) => compareTr(a.name, b.name)),
  };
}
