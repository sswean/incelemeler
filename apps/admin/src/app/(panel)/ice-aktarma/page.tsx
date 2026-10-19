import type { Metadata } from 'next';
import Link from 'next/link';
import { tr } from '@incelemeler/i18n';
import { formatDate } from '@incelemeler/utils';
import { Alert, PageTitle } from '../../../components/ui';
import { api, requireStaff } from '../../../lib/session';
import { ImportForm } from './import-form';

export const metadata: Metadata = { title: tr.imports.title };
export const dynamic = 'force-dynamic';

export default async function ImportsPage() {
  const { token, user } = await requireStaff();
  if (!user.permissions.includes('listings.write')) {
    return <Alert kind="error">{tr.errors.FORBIDDEN}</Alert>;
  }
  const client = await api(token);
  const [{ data: categories }, { data: batches }] = await Promise.all([
    client.GET('/v1/admin/categories'),
    client.GET('/v1/admin/imports'),
  ]);
  return (
    <div className="space-y-8">
      <div className="max-w-3xl space-y-4 rounded-lg border border-border-default bg-bg-default p-6">
        <PageTitle>{tr.imports.title}</PageTitle>
        <p className="text-sm text-text-secondary">{tr.imports.intro}</p>
        <ImportForm categories={categories?.data ?? []} />
      </div>
      <section aria-labelledby="son" className="space-y-3">
        <h2 id="son" className="text-lg font-semibold">
          {tr.imports.recent}
        </h2>
        {!batches?.data.length ? (
          <p className="text-sm">{tr.imports.none}</p>
        ) : (
          <ul className="divide-y divide-border-default rounded-md border border-border-default bg-bg-default">
            {batches.data.map((b) => (
              <li key={b.id} className="px-4 py-3 text-sm">
                <Link href={`/ice-aktarma/${b.id}`} className="text-brand-default underline">
                  {b.fileName ?? b.id}
                </Link>{' '}
                · {b.primaryCategory.name} · {tr.imports.statuses[b.status]} ·{' '}
                {formatDate(new Date(b.createdAt))}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
