import type { Metadata } from 'next';
import Link from 'next/link';
import { ArticleStatus, ArticleType } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { formatDate } from '@incelemeler/utils';
import { Alert, PageTitle } from '../../../components/ui';
import { errorMessage, problemCode } from '../../../lib/errors';
import { api, requireStaff } from '../../../lib/session';

export const metadata: Metadata = { title: tr.content.title };
export const dynamic = 'force-dynamic';

const selectClass = 'min-h-11 rounded-md border border-border-strong bg-bg-default px-3 py-2';

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ tur?: string; durum?: string; benim?: string; cursor?: string }>;
}) {
  const { token } = await requireStaff();
  const sp = await searchParams;
  const type = ArticleType.safeParse(sp.tur).data;
  const status = ArticleStatus.safeParse(sp.durum).data;
  const { data, error } = await (
    await api(token)
  ).GET('/v1/admin/articles', {
    params: {
      query: {
        type,
        status,
        ...(sp.benim === '1' ? { mine: '1' as const } : {}),
        cursor: sp.cursor,
        limit: 50,
      },
    },
  });
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageTitle>{tr.content.title}</PageTitle>
        <Link
          href="/icerikler/yeni"
          className="inline-flex min-h-11 items-center rounded-md bg-brand-default px-5 py-2 font-medium text-on-brand"
        >
          {tr.content.newContent}
        </Link>
      </div>
      <form className="flex flex-wrap items-end gap-3" role="search">
        <label className="space-y-1 text-sm">
          <span className="block font-medium">{tr.content.type}</span>
          <select name="tur" defaultValue={type ?? ''} className={selectClass}>
            <option value="">—</option>
            {ArticleType.options.map((t) => (
              <option key={t} value={t}>
                {tr.content.types[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="block font-medium">{tr.listings.status}</span>
          <select name="durum" defaultValue={status ?? ''} className={selectClass}>
            <option value="">—</option>
            {ArticleStatus.options.map((s) => (
              <option key={s} value={s}>
                {tr.content.statuses[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="benim"
            value="1"
            defaultChecked={sp.benim === '1'}
            className="h-5 w-5"
          />
          {tr.content.mine}
        </label>
        <button type="submit" className="min-h-11 rounded-md border border-border-strong px-4">
          {tr.listings.filter}
        </button>
      </form>
      {!data ? (
        <Alert kind="error">{errorMessage(problemCode(error))}</Alert>
      ) : data.data.length === 0 ? (
        <p>{tr.content.empty}</p>
      ) : (
        <ul
          className="divide-y divide-border-default rounded-md border border-border-default bg-bg-default"
          data-testid="article-list"
        >
          {data.data.map((a) => (
            <li key={a.id} className="px-4 py-3 text-sm">
              <Link
                href={`/icerikler/${a.id}`}
                className="font-medium text-brand-default underline"
              >
                {a.title}
              </Link>
              <span className="block text-text-secondary">
                {tr.content.types[a.type]} · {tr.content.statuses[a.status]} · {a.authorName} ·{' '}
                {formatDate(new Date(a.updatedAt))}
              </span>
            </li>
          ))}
        </ul>
      )}
      {data?.page.nextCursor ? (
        <Link
          href={`/icerikler?${new URLSearchParams({ ...(type ? { tur: type } : {}), ...(status ? { durum: status } : {}), cursor: data.page.nextCursor })}`}
          className="text-brand-default underline"
        >
          {tr.listings.more}
        </Link>
      ) : null}
    </div>
  );
}
