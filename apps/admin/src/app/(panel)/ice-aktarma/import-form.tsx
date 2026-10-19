'use client';

import { useActionState, useState } from 'react';
import type { AdminCategory, ListingKind } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { Alert, SubmitButton } from '../../../components/ui';
import { errorMessage } from '../../../lib/errors';
import { type ImportFormState, previewImportAction } from './actions';

const inputClass =
  'block w-full rounded-md border border-border-strong bg-bg-default px-3 py-2 text-base';
type FileError = keyof typeof tr.imports.fileErrors;

export function ImportForm({ categories }: { categories: AdminCategory[] }) {
  const [state, action] = useActionState<ImportFormState, FormData>(previewImportAction, {});
  const [kind, setKind] = useState<ListingKind>('PLACE');
  const kinds = Object.keys(tr.taxonomy.kindLabels) as ListingKind[];
  const message =
    state.fieldCode && state.fieldCode in tr.imports.fileErrors
      ? tr.imports.fileErrors[state.fieldCode as FileError]
      : errorMessage(state.error);
  return (
    <form action={action} className="space-y-4" aria-label={tr.imports.title}>
      {state.error ? <Alert kind="error">{message}</Alert> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="kind" className="block text-sm font-medium">
            {tr.listings.kind}
          </label>
          <select
            id="kind"
            name="kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as ListingKind)}
            className={inputClass}
          >
            {kinds.map((k) => (
              <option key={k} value={k}>
                {tr.taxonomy.kindLabels[k]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="primaryCategoryId" className="block text-sm font-medium">
            {tr.listings.category}
          </label>
          <select id="primaryCategoryId" name="primaryCategoryId" required className={inputClass}>
            {categories
              .filter((c) => c.allowedKinds.includes(kind))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {'— '.repeat(c.depth - 1)}
                  {c.name}
                </option>
              ))}
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <label htmlFor="source" className="block text-sm font-medium">
          {tr.listings.source}
        </label>
        <input
          id="source"
          name="source"
          required
          minLength={2}
          maxLength={200}
          aria-describedby="source-ipucu"
          className={inputClass}
        />
        <p id="source-ipucu" className="text-sm text-text-secondary">
          {tr.listings.sourceHint}
        </p>
      </div>
      <div className="space-y-1">
        <label htmlFor="file" className="block text-sm font-medium">
          {tr.imports.file}
        </label>
        <input
          id="file"
          name="file"
          type="file"
          required
          accept=".csv,text/csv"
          aria-describedby="file-ipucu"
          className={inputClass}
        />
        <p id="file-ipucu" className="text-sm text-text-secondary">
          {tr.imports.columnsHint}
        </p>
      </div>
      <SubmitButton>{tr.imports.preview}</SubmitButton>
    </form>
  );
}
