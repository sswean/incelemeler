import type { Metadata } from 'next';
import { tr } from '@incelemeler/i18n';
import { formatLongDate } from '@incelemeler/utils';
import { Alert, Checkbox, Field, PageTitle, SubmitButton } from '../../components/ui';
import { errorMessage } from '../../lib/errors';
import { takedownAction } from '../account-actions';

const T = tr.takedown;
export const metadata: Metadata = { title: T.title, robots: { index: false } };
export const dynamic = 'force-dynamic';

const select =
  'block min-h-11 w-full rounded-md border border-border-strong bg-bg-default px-3 text-base';
const PUBLIC_KINDS = ['COPYRIGHT', 'PERSONALITY_RIGHTS', 'OTHER_LEGAL'] as const;
const CAPACITIES = ['RIGHT_HOLDER', 'REPRESENTATIVE', 'AFFECTED_PERSON', 'OTHER'] as const;

/** Hukuki talep ve içerik kaldırma bildirimi (REQ-GUN-005). Belge yükleme X-010 olmadan kapalı. */
export default async function TakedownPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string; hata?: string; ref?: string; son?: string }>;
}) {
  const sp = await searchParams;
  if (sp.durum === 'alindi' && sp.ref && sp.son) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PageTitle>{T.title}</PageTitle>
        <Alert kind="success">
          {T.sent.replace('{reference}', sp.ref).replace('{due}', formatLongDate(new Date(sp.son)))}
        </Alert>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageTitle>{T.title}</PageTitle>
      {sp.hata ? <Alert kind="error">{errorMessage(sp.hata)}</Alert> : null}
      <p>{T.intro}</p>
      <form action={takedownAction} className="space-y-4" aria-label={T.title}>
        <div className="space-y-1">
          <label htmlFor="kind" className="block text-sm font-medium">
            {T.kind}
          </label>
          <select id="kind" name="kind" className={select}>
            {PUBLIC_KINDS.map((k) => (
              <option key={k} value={k}>
                {T.kinds[k]}
              </option>
            ))}
          </select>
        </div>
        <Field
          id="requesterName"
          label={T.requesterName}
          required
          autoComplete="name"
          maxLength={120}
        />
        <Field
          id="requesterOrg"
          label={T.requesterOrg}
          autoComplete="organization"
          maxLength={160}
        />
        <Field
          id="requesterEmail"
          type="email"
          label={T.requesterEmail}
          required
          autoComplete="email"
        />
        <div className="space-y-1">
          <label htmlFor="requesterCapacity" className="block text-sm font-medium">
            {T.requesterCapacity}
          </label>
          <select id="requesterCapacity" name="requesterCapacity" className={select}>
            {CAPACITIES.map((c) => (
              <option key={c} value={c}>
                {T.capacities[c]}
              </option>
            ))}
          </select>
        </div>
        <Field id="targetUrl" type="url" label={T.targetUrl} required maxLength={500} />
        <div className="space-y-1">
          <label htmlFor="legalBasis" className="block text-sm font-medium">
            {T.legalBasis}
          </label>
          <textarea
            id="legalBasis"
            name="legalBasis"
            required
            minLength={20}
            maxLength={4000}
            rows={6}
            aria-describedby="legalBasis-ipucu"
            className="block w-full rounded-md border border-border-strong bg-bg-default px-3 py-2 text-base"
          />
          <p id="legalBasis-ipucu" className="text-sm text-text-secondary">
            {T.legalBasisHint}
          </p>
        </div>
        <Field id="documentsNote" label={T.documentsNote} hint={T.documentsHint} maxLength={1000} />
        <Checkbox id="goodFaithAck" label={T.goodFaithAck} required />
        <SubmitButton>{T.submit}</SubmitButton>
      </form>
    </div>
  );
}
