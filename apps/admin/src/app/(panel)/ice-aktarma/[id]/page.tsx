import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { tr } from '@incelemeler/i18n';
import { Alert, PageTitle } from '../../../../components/ui';
import { errorMessage } from '../../../../lib/errors';
import { api, requireStaff } from '../../../../lib/session';
import { importCommandAction } from '../actions';

export const metadata: Metadata = { title: tr.imports.title };
export const dynamic = 'force-dynamic';

type RowError = keyof typeof tr.imports.rowErrors;
type FileError = keyof typeof tr.imports.fileErrors;

export default async function ImportBatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ durum?: string; hata?: string }>;
}) {
  const { token } = await requireStaff();
  const { id } = await params;
  const { durum, hata } = await searchParams;
  const { data: batch } = await (
    await api(token)
  ).GET('/v1/admin/imports/{id}', { params: { path: { id } } });
  if (!batch) notFound();
  const summary = tr.imports.summary
    .replace('{rows}', String(batch.rowCount))
    .replace('{valid}', String(batch.validCount))
    .replace('{created}', String(batch.createdCount));
  const command =
    batch.status === 'PREVIEW' ? 'commit' : batch.status === 'COMMITTED' ? 'rollback' : null;

  return (
    <div className="space-y-6">
      <PageTitle>{tr.imports.title}</PageTitle>
      <p className="text-sm" data-testid="import-summary">
        {batch.fileName} · {batch.primaryCategory.name} · {tr.imports.statuses[batch.status]} ·{' '}
        {summary}
      </p>
      <p className="text-sm text-text-secondary">
        {tr.listings.source}: {batch.source}
      </p>
      {durum === 'kaydedildi' ? <Alert kind="success">{tr.admin.saved}</Alert> : null}
      {hata ? (
        <Alert kind="error">
          {hata in tr.imports.fileErrors
            ? tr.imports.fileErrors[hata as FileError]
            : errorMessage(hata)}
        </Alert>
      ) : null}
      {batch.unmappedHeaders.length ? (
        <p className="text-sm">
          {tr.imports.unmapped}: {batch.unmappedHeaders.join(', ')}
        </p>
      ) : null}
      {command ? (
        <form action={importCommandAction}>
          <input type="hidden" name="id" value={batch.id} />
          <input type="hidden" name="command" value={command} />
          <button
            type="submit"
            className="inline-flex min-h-11 items-center rounded-md bg-brand-default px-5 py-2 font-medium text-on-brand"
          >
            {command === 'commit' ? tr.imports.commit : tr.imports.rollback}
          </button>
        </form>
      ) : null}
      <div className="overflow-x-auto rounded-lg border border-border-default bg-bg-default">
        <table className="w-full text-left text-sm" data-testid="import-rows">
          <thead className="border-b border-border-default">
            <tr>
              <th scope="col" className="px-4 py-3">
                {tr.imports.row}
              </th>
              <th scope="col" className="px-4 py-3">
                {tr.listings.name}
              </th>
              <th scope="col" className="px-4 py-3">
                {tr.imports.result}
              </th>
            </tr>
          </thead>
          <tbody>
            {batch.rows.map((r) => (
              <tr key={r.row} className="border-b border-border-default last:border-0 align-top">
                <td className="px-4 py-2">{r.row}</td>
                <td className="px-4 py-2">
                  {r.listingId ? (
                    <Link
                      href={`/listelemeler/${r.listingId}`}
                      className="text-brand-default underline"
                    >
                      {r.name}
                    </Link>
                  ) : (
                    (r.name ?? '—')
                  )}
                </td>
                <td className="px-4 py-2">
                  <strong>{tr.imports.rowStatuses[r.status]}</strong>
                  {r.duplicateOf ? (
                    <span className="block">
                      {r.duplicateOf.row
                        ? `${tr.imports.duplicateOfRow} ${r.duplicateOf.row}`
                        : tr.imports.duplicateOfListing}{' '}
                      ({tr.imports.reasons[r.duplicateOf.reason]})
                    </span>
                  ) : null}
                  {r.errors.map((e) => (
                    <span key={`${e.field}-${e.code}`} className="block text-danger-text">
                      {e.field}:{' '}
                      {e.code in tr.imports.rowErrors
                        ? tr.imports.rowErrors[e.code as RowError]
                        : e.code}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
