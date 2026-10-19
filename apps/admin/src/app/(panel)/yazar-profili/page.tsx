import type { Metadata } from 'next';
import { tr } from '@incelemeler/i18n';
import { Alert, Field, PageTitle, SubmitButton } from '../../../components/ui';
import { errorMessage } from '../../../lib/errors';
import { api, requireStaff } from '../../../lib/session';
import { saveAuthorProfileAction } from './actions';

export const metadata: Metadata = { title: tr.authorProfile.title };
export const dynamic = 'force-dynamic';

const P = tr.authorProfile;
type FieldError = keyof typeof P.fieldErrors;

function TextArea(props: {
  id: string;
  label: string;
  hint?: string;
  defaultValue?: string;
  maxLength: number;
}) {
  const hintId = props.hint ? `${props.id}-ipucu` : undefined;
  return (
    <div className="space-y-1">
      <label htmlFor={props.id} className="block text-sm font-medium">
        {props.label}
      </label>
      <textarea
        id={props.id}
        name={props.id}
        rows={4}
        maxLength={props.maxLength}
        defaultValue={props.defaultValue}
        aria-describedby={hintId}
        className="block w-full rounded-md border border-border-strong bg-bg-default px-3 py-2"
      />
      {props.hint ? (
        <p id={hintId} className="text-sm text-text-secondary">
          {props.hint}
        </p>
      ) : null}
    </div>
  );
}

/** Personelin kendi yazar profili (REQ-ICR-011). */
export default async function AuthorProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string; hata?: string }>;
}) {
  const { token } = await requireStaff();
  const { durum, hata } = await searchParams;
  const { data, error } = await (await api(token)).GET('/v1/admin/author-profile');
  if (!data) {
    return (
      <div className="max-w-2xl space-y-4">
        <PageTitle>{P.title}</PageTitle>
        <Alert kind="error">{errorMessage((error as { code?: string } | undefined)?.code)}</Alert>
      </div>
    );
  }
  const p = data.profile;
  const webBase = process.env.WEB_BASE_URL ?? 'http://localhost:3000';
  const hataText = hata
    ? hata in P.fieldErrors
      ? P.fieldErrors[hata as FieldError]
      : errorMessage(hata)
    : null;
  return (
    <div className="max-w-2xl space-y-6 rounded-lg border border-border-default bg-bg-default p-6">
      <div className="space-y-1">
        <PageTitle>{P.title}</PageTitle>
        <p className="text-sm text-text-secondary">
          {P.intro} <strong>{data.displayName}</strong>
        </p>
      </div>
      {durum === 'kaydedildi' ? <Alert kind="success">{tr.admin.saved}</Alert> : null}
      {hataText ? <Alert kind="error">{hataText}</Alert> : null}
      {p ? (
        <p className="text-sm">
          <a
            href={`${webBase}/yazar/${p.slug}`}
            className="text-brand-default underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {P.view}
          </a>
        </p>
      ) : null}
      <form action={saveAuthorProfileAction} className="space-y-4" aria-label={P.title}>
        {p ? <input type="hidden" name="version" value={p.version} /> : null}
        <Field
          id="slug"
          label={P.slug}
          hint={P.slugHint}
          required
          minLength={2}
          maxLength={80}
          defaultValue={p?.slug}
        />
        <Field id="jobTitle" label={P.jobTitle} maxLength={120} defaultValue={p?.title ?? ''} />
        <TextArea id="bio" label={P.bio} maxLength={2000} defaultValue={p?.bio ?? ''} />
        <Field
          id="expertise"
          label={P.expertise}
          hint={P.expertiseHint}
          maxLength={800}
          defaultValue={p?.expertise.join(', ')}
        />
        <TextArea
          id="ethics"
          label={P.ethics}
          hint={P.ethicsHint}
          maxLength={2000}
          defaultValue={p?.ethics ?? ''}
        />
        <TextArea
          id="links"
          label={P.links}
          hint={P.linksHint}
          maxLength={2000}
          defaultValue={p?.links.map((l) => `${l.label} | ${l.url}`).join('\n')}
        />
        <SubmitButton>{P.save}</SubmitButton>
      </form>
    </div>
  );
}
