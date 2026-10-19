'use client';

import { useActionState, useState } from 'react';
import type { AdminCategory, ListingKind } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { Alert, SubmitButton } from '../../../../components/ui';
import { errorMessage } from '../../../../lib/errors';
import { createListingAction, type ListingFormState } from '../actions';
import { listingFieldError } from '../messages';

const inputClass =
  'block w-full rounded-md border border-border-strong bg-bg-default px-3 py-2 text-base';

export function CreateListingForm({
  categories,
  allowDemo,
}: {
  categories: AdminCategory[];
  allowDemo: boolean;
}) {
  const [state, action] = useActionState<ListingFormState, FormData>(createListingAction, {});
  const kinds = Object.keys(tr.taxonomy.kindLabels) as ListingKind[];
  const [kind, setKind] = useState<ListingKind>('PLACE');
  const options = categories.filter((c) => c.allowedKinds.includes(kind));
  const err = (f: string) => {
    const m = listingFieldError(state.fieldErrors?.[f]);
    return m ? <p className="text-sm text-danger-text">{m}</p> : null;
  };
  return (
    <form action={action} className="space-y-4">
      {state.error ? (
        <Alert kind="error">
          {state.fieldErrors && Object.keys(state.fieldErrors).length
            ? tr.errors.VALIDATION_FAILED
            : errorMessage(state.error)}
        </Alert>
      ) : null}
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
          {options.map((c) => (
            <option key={c.id} value={c.id}>
              {'— '.repeat(c.depth - 1)}
              {c.name}
            </option>
          ))}
        </select>
        {err('primaryCategoryId')}
      </div>
      <div className="space-y-1">
        <label htmlFor="name" className="block text-sm font-medium">
          {tr.listings.name}
        </label>
        <input
          id="name"
          name="name"
          required
          minLength={2}
          maxLength={120}
          className={inputClass}
        />
        {err('name')}
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
      {allowDemo ? (
        <fieldset className="space-y-1">
          <legend className="text-sm font-medium">{tr.listings.dataOrigin}</legend>
          {(['EDITORIAL', 'DEMO'] as const).map((o) => (
            <label key={o} className="flex min-h-11 items-center gap-2 text-sm">
              <input type="radio" name="dataOrigin" value={o} defaultChecked={o === 'EDITORIAL'} />
              {tr.listings.origins[o]}
            </label>
          ))}
          {err('dataOrigin')}
        </fieldset>
      ) : null}
      <SubmitButton>{tr.listings.newListing}</SubmitButton>
    </form>
  );
}
