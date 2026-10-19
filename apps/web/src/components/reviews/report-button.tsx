'use client';

import { useActionState, useId } from 'react';
import { reviews } from '@incelemeler/i18n';
import { reportAction } from '../../app/degerlendir/actions';
import { errorMessage } from '../../lib/errors';

// Yalnızca kullanılan ad alanı istemci paketine girer (REQ-PRF-004).
const tr = { reviews };

const R = tr.reviews;

/** "Bildir" (REQ-GUN-002): sabit neden listesi; misafir de bildirebilir (hız sınırlı). */
export function ReportButton({ reviewId, signedIn }: { reviewId: string; signedIn: boolean }) {
  const id = useId();
  const [state, action] = useActionState(reportAction, {});
  if (state.ok) {
    return (
      <p role="status" className="text-sm">
        {R.reportThanks}
      </p>
    );
  }
  return (
    <details className="text-sm">
      <summary className="min-h-11 cursor-pointer content-center underline">{R.report}</summary>
      <form
        action={action}
        className="mt-2 space-y-2 rounded-md border border-border-default p-3"
        aria-label={R.reportTitle}
      >
        <input type="hidden" name="targetId" value={reviewId} />
        <label className="block space-y-1">
          <span className="font-medium">{R.reportReason}</span>
          <select
            name="reason"
            required
            defaultValue=""
            className="block min-h-11 w-full rounded-md border border-border-strong bg-bg-default px-2"
          >
            <option value="" disabled>
              —
            </option>
            {Object.entries(R.reportReasons).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="font-medium">{R.reportDescription}</span>
          <textarea
            name="description"
            rows={2}
            maxLength={2000}
            className="block w-full rounded-md border border-border-strong bg-bg-default px-2 py-1"
          />
        </label>
        {signedIn ? null : (
          <label className="block space-y-1" htmlFor={`${id}-email`}>
            <span className="font-medium">{R.reportEmail}</span>
            <input
              id={`${id}-email`}
              name="email"
              type="email"
              autoComplete="email"
              className="block min-h-11 w-full rounded-md border border-border-strong bg-bg-default px-2"
            />
          </label>
        )}
        {state.error ? <p className="text-danger-text">{errorMessage(state.error)}</p> : null}
        <button type="submit" className="min-h-11 rounded-md border border-border-strong px-4">
          {R.reportSend}
        </button>
      </form>
    </details>
  );
}
