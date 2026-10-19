import type { Metadata } from 'next';
import { tr } from '@incelemeler/i18n';
import { Alert, Field, PageTitle, SubmitButton } from '../../components/ui';
import { errorMessage } from '../../lib/errors';
import { getSessionToken } from '../../lib/session';
import { dataRequestAction } from '../account-actions';

const T = tr.privacy;
export const metadata: Metadata = { title: T.requestTitle, robots: { index: false } };
export const dynamic = 'force-dynamic';

const TYPES = Object.keys(T.types) as Array<keyof typeof T.types>;

/** KVKK başvuru formu (REQ-KVK-022): gereksiz kimlik verisi istenmez. */
export default async function DataRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string; hata?: string }>;
}) {
  const signedIn = Boolean(await getSessionToken());
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageTitle>{T.requestTitle}</PageTitle>
      {sp.durum === 'dogrula' ? <Alert kind="success">{T.sentVerify}</Alert> : null}
      {sp.durum === 'alindi' ? <Alert kind="success">{T.sentVerified}</Alert> : null}
      {sp.durum === 'dogrulandi' ? <Alert kind="success">{T.verified}</Alert> : null}
      {sp.hata ? <Alert kind="error">{errorMessage(sp.hata)}</Alert> : null}
      <p>{T.requestIntro}</p>
      <form action={dataRequestAction} className="space-y-4" aria-label={T.requestTitle}>
        <div className="space-y-1">
          <label htmlFor="type" className="block text-sm font-medium">
            {T.type}
          </label>
          <select
            id="type"
            name="type"
            className="block min-h-11 w-full rounded-md border border-border-strong bg-bg-default px-3 text-base"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {T.types[t]}
              </option>
            ))}
          </select>
        </div>
        {signedIn ? (
          <p className="text-sm text-text-secondary">{T.emailSignedIn}</p>
        ) : (
          <Field id="email" type="email" label={T.email} autoComplete="email" required />
        )}
        <div className="space-y-1">
          <label htmlFor="description" className="block text-sm font-medium">
            {T.description}
          </label>
          <textarea
            id="description"
            name="description"
            required
            minLength={10}
            maxLength={4000}
            rows={5}
            className="block w-full rounded-md border border-border-strong bg-bg-default px-3 py-2 text-base"
          />
        </div>
        <SubmitButton>{T.submit}</SubmitButton>
      </form>
    </div>
  );
}
