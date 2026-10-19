'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { tr } from '@incelemeler/i18n';
import { Alert, Field, SubmitButton } from '../../../components/ui';
import { errorMessage } from '../../../lib/errors';
import { type MfaSetupState, mfaConfirmAction } from '../../actions';

export function MfaSetupForm({ secret, otpauthUrl }: { secret: string; otpauthUrl: string }) {
  const [state, action] = useActionState<MfaSetupState, FormData>(mfaConfirmAction, {});
  if (state.recoveryCodes) {
    return (
      <section aria-labelledby="kurtarma" className="space-y-4">
        <h2 id="kurtarma" className="text-lg font-semibold">
          {tr.admin.recoveryTitle}
        </h2>
        <p className="text-sm">{tr.admin.recoveryIntro}</p>
        <ul className="grid grid-cols-2 gap-2 font-mono text-sm" data-testid="recovery-codes">
          {state.recoveryCodes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <p className="text-sm text-text-secondary">{tr.admin.recoveryHint}</p>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-md bg-brand-default px-5 py-2 font-medium text-on-brand"
        >
          {tr.admin.continue}
        </Link>
      </section>
    );
  }
  return (
    <div className="space-y-4">
      <p className="text-sm">{tr.admin.mfaSetupIntro}</p>
      <div className="space-y-1">
        <p className="text-sm font-medium">{tr.admin.mfaSecret}</p>
        <p className="break-all font-mono text-sm" data-testid="mfa-secret">
          {secret}
        </p>
        <a href={otpauthUrl} className="text-sm text-brand-default underline">
          {tr.admin.openInApp}
        </a>
      </div>
      {state.error ? <Alert kind="error">{errorMessage(state.error)}</Alert> : null}
      <form action={action} className="space-y-4">
        <Field id="code" label={tr.admin.mfaCode} required autoComplete="one-time-code" />
        <SubmitButton>{tr.admin.mfaConfirm}</SubmitButton>
      </form>
    </div>
  );
}
