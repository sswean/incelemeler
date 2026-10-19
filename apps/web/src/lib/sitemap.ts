import 'server-only';
import { articlePath, listingPath } from '@incelemeler/routes';
import { serverApi } from './api';
import { canonical } from './seo';

export const PER_FILE = 50_000;

function escape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function xml(body: string): Response {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n${body}`, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

/** Yayındaki listeleme sayfaları (demo, kapalı, taslak hariç — API süzer). */
export async function listingPages(): Promise<Array<Array<{ loc: string; lastmod: string }>>> {
  const pages: Array<Array<{ loc: string; lastmod: string }>> = [];
  let cursor: string | undefined;
  do {
    const { data } = await serverApi().GET('/v1/sitemap/listings', {
      params: { query: { limit: PER_FILE, ...(cursor ? { cursor } : {}) } },
    });
    if (!data) break;
    pages.push(
      data.data.map((e) => ({
        loc: canonical(listingPath({ kind: e.kind, slug: e.slug, carRental: e.carRental })),
        lastmod: e.lastmod,
      })),
    );
    cursor = data.nextCursor ?? undefined;
  } while (cursor);
  return pages.length ? pages : [[]];
}

/** Yayındaki içerikler (demo hariç — API süzer). */
export async function articlePages(): Promise<Array<{ loc: string; lastmod: string }>> {
  const { data } = await serverApi().GET('/v1/sitemap/articles');
  return (data?.data ?? []).map((e) => ({
    loc: canonical(articlePath({ type: e.type, slug: e.slug })),
    lastmod: e.lastmod,
  }));
}

export function urlset(entries: Array<{ loc: string; lastmod?: string }>): string {
  return `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
    .map(
      (e) =>
        `  <url><loc>${escape(e.loc)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}</url>`,
    )
    .join('\n')}\n</urlset>`;
}
