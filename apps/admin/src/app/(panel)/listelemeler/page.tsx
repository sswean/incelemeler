import type { Metadata } from 'next';
import Link from 'next/link';
import { ListingKind, ListingStatus } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { formatDate } from '@incelemeler/utils';
import { Alert, PageTitle } from '../../../components/ui';
import { errorMessage, problemCode } from '../../../lib/errors';
import { api, requireStaff } from '../../../lib/session';

export const metadata: Metadata = { title: tr.listings.title };
export const dynamic = 'force-dynamic';

const selectClass = 'min-h-11 rounded-md border border-border-strong bg-bg-default px-3 py-2';

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tur?: string; durum?: string; q?: string; cursor?: string }>;
}) {
  const { token } = await requireStaff();
  const sp = await searchParams;
  const kind = ListingKind.safeParse(sp.tur).data;
  const status = ListingStatus.safeParse(sp.durum).data;
  const q = sp.q?.trim() || undefined;
  const { data, error } = await (
    await api(token)
  ).GET('/v1/admin/listings', {
    params: { query: { kind, status, q, cursor: sp.cursor, limit: 50 } },
  });
  const more = data?.page.nextCursor
    ? `?${new URLSearchParams({
        ...(kind ? { tur: kind } : {}),
        ...(status ? { durum: status } : {}),
        ...(q ? { q } : {}),
        cursor: data.page.nextCursor,
      })}`
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageTitle>{tr.listings.title}</PageTitle>
        <Link
          href="/listelemeler/yeni"
          className="inline-flex min-h-11 items-center rounded-md bg-brand-default px-5 py-2 font-medium text-on-brand"
        >
          {tr.listings.newListing}
        </Link>
      </div>
      <form className="flex flex-wrap items-end gap-3" role="search">
        <label className="space-y-1 text-sm">
          <span className="block font-medium">{tr.listings.search}</span>
          <input name="q" defaultValue={q} className={selectClass} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="block font-medium">{tr.listings.kind}</span>
          <select name="tur" defaultValue={kind ?? ''} className={selectClass}>
            <option value="">{tr.listings.allKinds}</option>
            {ListingKind.options.map((k) => (
              <option key={k} value={k}>
                {tr.taxonomy.kindLabels[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="block font-medium">{tr.listings.status}</span>
          <select name="durum" defaultValue={status ?? ''} className={selectClass}>
            <option value="">{tr.listings.allStatuses}</option>
            {ListingStatus.options.map((s) => (
              <option key={s} value={s}>
                {tr.listings.statuses[s]}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="min-h-11 rounded-md border border-border-strong px-4">
          {tr.listings.filter}
        </button>
      </form>
      {!data ? (
        <Alert kind="error">{errorMessage(problemCode(error))}</Alert>
      ) : data.data.length === 0 ? (
        <p>{tr.listings.empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border-default bg-bg-default">
          <table className="w-full text-left text-sm" data-testid="listing-table">
            <thead className="border-b border-border-default">
              <tr>
                <th scope="col" className="px-4 py-3">
                  {tr.listings.name}
                </th>
                <th scope="col" className="px-4 py-3">
                  {tr.listings.kind}
                </th>
                <th scope="col" className="px-4 py-3">
                  {tr.listings.province}
                </th>
                <th scope="col" className="px-4 py-3">
                  {tr.listings.status}
                </th>
                <th scope="col" className="px-4 py-3">
                  {tr.listings.updatedAt}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((l) => (
                <tr key={l.id} className="border-b border-border-default last:border-0">
                  <td className="px-4 py-2">
                    <Link href={`/listelemeler/${l.id}`} className="text-brand-default underline">
                      {l.name}
                    </Link>
                    {l.dataOrigin === 'DEMO' ? (
                      <span className="ml-2 rounded border border-border-strong px-1 text-xs">
                        {tr.listings.demoBadge}
                      </span>
                    ) : null}
                    <span className="block text-xs text-text-secondary">
                      {l.primaryCategoryName}
                    </span>
                  </td>
                  <td className="px-4 py-2">{tr.taxonomy.kindLabels[l.kind]}</td>
                  <td className="px-4 py-2">{l.provinceName ?? '—'}</td>
                  <td className="px-4 py-2">{tr.listings.statuses[l.status]}</td>
                  <td className="px-4 py-2">{formatDate(new Date(l.updatedAt))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {more ? (
        <Link href={`/listelemeler${more}`} className="text-brand-default underline">
          {tr.listings.more}
        </Link>
      ) : null}
    </div>
  );
}
