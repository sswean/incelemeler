import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { tr } from '@incelemeler/i18n';
import { STATIC_PATHS } from '@incelemeler/routes';
import { Alert, Checkbox, PageTitle, SubmitButton } from '../../../components/ui';
import { errorMessage } from '../../../lib/errors';
import { api, getSessionToken } from '../../../lib/session';
import { acceptLegalAction } from '../../auth-actions';

const T = tr.privacy;
export const metadata: Metadata = { title: T.acceptTitle, robots: { index: false } };
export const dynamic = 'force-dynamic';

const HREF = { TERMS: STATIC_PATHS.terms, PRIVACY_NOTICE: STATIC_PATHS.privacy } as const;

/** Esaslı değişiklik sonrası yeniden kabul (REQ-KVK-004); kutu önceden işaretli değil. */
export default async function AcceptPage({
  searchParams,
}: {
  searchParams: Promise<{ sonra?: string; hata?: string }>;
}) {
  const token = await getSessionToken();
  if (!token) redirect('/giris');
  const sp = await searchParams;
  const { data } = await (await api(token)).GET('/v1/me/legal-acceptances/pending');
  const next = sp.sonra?.startsWith('/') && !sp.sonra.startsWith('//') ? sp.sonra : '/hesabim';
  if (!data?.data.length) redirect(next);
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageTitle>{T.acceptTitle}</PageTitle>
      <p>{T.acceptIntro}</p>
      {sp.hata ? <Alert kind="error">{errorMessage(sp.hata)}</Alert> : null}
      <ul className="list-disc space-y-1 pl-6" data-testid="pending-documents">
        {data.data.map((d) => (
          <li key={d.id}>
            <Link href={HREF[d.docType as keyof typeof HREF] ?? '/'} className="underline">
              {T.acceptDocs[d.docType as keyof typeof T.acceptDocs] ?? d.docType}
            </Link>{' '}
            ({d.version}){d.draft ? ` · ${T.draft}` : ''}
          </li>
        ))}
      </ul>
      <form action={acceptLegalAction} className="space-y-4" aria-label={T.acceptTitle}>
        <input type="hidden" name="sonra" value={next} />
        {data.data.map((d) => (
          <input key={d.id} type="hidden" name="versionId" value={d.id} />
        ))}
        <Checkbox id="confirm" label={T.acceptCheckbox} required />
        <SubmitButton>{T.acceptButton}</SubmitButton>
      </form>
    </div>
  );
}
