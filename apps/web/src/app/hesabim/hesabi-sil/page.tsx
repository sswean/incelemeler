import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { tr } from '@incelemeler/i18n';
import { Alert, Checkbox, Field, PageTitle, SubmitButton } from '../../../components/ui';
import { errorMessage } from '../../../lib/errors';
import { getSessionToken } from '../../../lib/session';
import { deleteAccountAction } from '../../account-actions';

const T = tr.account;
/** Geri alma penceresi (gün) — API'deki ACCOUNT_DELETION_DAYS ile aynı (A-022). */
const DELETION_DAYS = 30;
export const metadata: Metadata = { title: T.deleteTitle, robots: { index: false } };
export const dynamic = 'force-dynamic';

/** Hesap silme: Hesabım › Hesabımı sil › onay (REQ-KVK-020/021); silinen ve saklanan veriler gösterilir. */
export default async function DeleteAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string }>;
}) {
  if (!(await getSessionToken())) redirect('/giris?sonra=%2Fhesabim%2Fhesabi-sil');
  const { hata } = await searchParams;
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageTitle>{T.deleteTitle}</PageTitle>
      <p>{T.deleteIntro.replace('{days}', String(DELETION_DAYS))}</p>
      {hata ? <Alert kind="error">{errorMessage(hata)}</Alert> : null}
      <section aria-labelledby="silinecekler" className="space-y-2">
        <h2 id="silinecekler" className="text-lg font-semibold">
          {T.deletedData}
        </h2>
        <ul className="list-disc space-y-1 pl-6">
          {T.deletedItems.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        <p className="text-sm">{T.contentChoice}</p>
      </section>
      <section aria-labelledby="saklananlar" className="space-y-2">
        <h2 id="saklananlar" className="text-lg font-semibold">
          {T.retainedData}
        </h2>
        <ul className="list-disc space-y-1 pl-6">
          {T.retainedItems.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </section>
      <form action={deleteAccountAction} className="space-y-4" aria-label={T.deleteTitle}>
        <Field
          id="password"
          type="password"
          label={T.password}
          autoComplete="current-password"
          required
        />
        <Checkbox id="confirm" label={T.confirm} required />
        <SubmitButton>{T.submit}</SubmitButton>
      </form>
    </div>
  );
}
