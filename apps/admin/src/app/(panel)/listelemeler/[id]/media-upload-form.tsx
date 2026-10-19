'use client';

import { useActionState } from 'react';
import { tr } from '@incelemeler/i18n';
import { Alert, SubmitButton } from '../../../../components/ui';
import { errorMessage } from '../../../../lib/errors';
import { type MediaFormState, uploadListingMediaAction } from '../media-actions';

const inputClass =
  'block w-full rounded-md border border-border-strong bg-bg-default px-3 py-2 text-base';

export function MediaUploadForm({ listingId }: { listingId: string }) {
  const [state, action] = useActionState<MediaFormState, FormData>(uploadListingMediaAction, {});
  return (
    <form action={action} className="space-y-3" aria-label={tr.media.upload}>
      <input type="hidden" name="listingId" value={listingId} />
      {state.error ? <Alert kind="error">{errorMessage(state.error)}</Alert> : null}
      <div className="space-y-1">
        <label htmlFor="file" className="block text-sm font-medium">
          {tr.media.file}
        </label>
        <input
          id="file"
          name="file"
          type="file"
          required
          accept="image/jpeg,image/png,image/webp"
          className={inputClass}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="altText" className="block text-sm font-medium">
          {tr.media.altText}
        </label>
        <input
          id="altText"
          name="altText"
          maxLength={300}
          aria-describedby="altText-ipucu"
          className={inputClass}
        />
        <p id="altText-ipucu" className="text-sm text-text-secondary">
          {tr.media.altTextHint}
        </p>
      </div>
      <SubmitButton>{tr.media.upload}</SubmitButton>
    </form>
  );
}
