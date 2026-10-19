'use client';

import { useActionState } from 'react';
import { tr } from '@incelemeler/i18n';
import { errorMessage } from '../../../../lib/errors';
import { previewAction } from '../actions';

/** İmzalı, süreli önizleme bağlantısı (REQ-ICR-005). */
export function PreviewButton({ id }: { id: string }) {
  const [state, action] = useActionState(previewAction, {});
  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="min-h-11 rounded-md border border-border-strong px-4 text-sm"
      >
        {tr.content.preview}
      </button>
      {state.url ? (
        <p className="text-sm" data-testid="preview-link">
          {tr.content.previewReady}{' '}
          <a
            href={state.url}
            className="break-all text-brand-default underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {state.url}
          </a>
        </p>
      ) : null}
      {state.error ? <p className="text-sm text-danger-text">{errorMessage(state.error)}</p> : null}
    </form>
  );
}
