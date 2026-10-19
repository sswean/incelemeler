import type { Metadata } from 'next';
import Link from 'next/link';
import { tr } from '@incelemeler/i18n';
import { Alert, PageTitle } from '../../../components/ui';
import { errorMessage, problemCode } from '../../../lib/errors';
import { api, requireStaff } from '../../../lib/session';

export const metadata: Metadata = { title: tr.taxonomy.title };
export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const { token, user } = await requireStaff();
  const canManage = user.permissions.includes('taxonomy.manage');
  const { data, error } = await (await api(token)).GET('/v1/admin/categories');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageTitle>{tr.taxonomy.title}</PageTitle>
        {canManage ? (
          <Link
            href="/kategoriler/yeni"
            className="inline-flex min-h-11 items-center rounded-md bg-brand-default px-5 py-2 font-medium text-on-brand"
          >
            {tr.taxonomy.newCategory}
          </Link>
        ) : null}
      </div>
      <p className="text-sm text-text-secondary">{tr.taxonomy.intro}</p>
      {canManage ? null : <Alert kind="info">{tr.admin.noPermission}</Alert>}
      {!data ? (
        <Alert kind="error">{errorMessage(problemCode(error))}</Alert>
      ) : data.data.length === 0 ? (
        <p>{tr.taxonomy.empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border-default bg-bg-default">
          <table className="w-full text-left text-sm" data-testid="category-table">
            <thead className="border-b border-border-default">
              <tr>
                <th scope="col" className="px-4 py-3">
                  {tr.taxonomy.name}
                </th>
                <th scope="col" className="px-4 py-3">
                  {tr.taxonomy.listingKinds}
                </th>
                <th scope="col" className="px-4 py-3">
                  {tr.taxonomy.status}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((c) => (
                <tr key={c.id} className="border-b border-border-default last:border-0">
                  <td className="px-4 py-2" style={{ paddingLeft: `${c.depth}rem` }}>
                    <Link href={`/kategoriler/${c.id}`} className="text-brand-default underline">
                      {c.name}
                    </Link>
                    <span className="block text-xs text-text-secondary">/{c.slug}</span>
                  </td>
                  <td className="px-4 py-2">
                    {c.allowedKinds.map((k) => tr.taxonomy.kindLabels[k]).join(', ')}
                  </td>
                  <td className="px-4 py-2">{tr.taxonomy.statuses[c.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
