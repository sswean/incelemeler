import type { Metadata } from 'next';
import { ArticleType } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { Alert, Field, PageTitle, SubmitButton } from '../../../../components/ui';
import { errorMessage } from '../../../../lib/errors';
import { requireStaff } from '../../../../lib/session';
import { createArticleAction } from '../actions';

export const metadata: Metadata = { title: tr.content.newContent };
export const dynamic = 'force-dynamic';

export default async function NewArticlePage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string }>;
}) {
  const { user } = await requireStaff();
  const { hata } = await searchParams;
  const types = ArticleType.options.filter((t) =>
    t === 'SPONSORED'
      ? user.permissions.includes('sponsored.content.write')
      : user.permissions.includes('content.publish') || user.permissions.includes('content.draft'),
  );
  return (
    <div className="max-w-2xl space-y-6 rounded-lg border border-border-default bg-bg-default p-6">
      <PageTitle>{tr.content.newContent}</PageTitle>
      {hata ? <Alert kind="error">{errorMessage(hata)}</Alert> : null}
      <form action={createArticleAction} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="type" className="block text-sm font-medium">
            {tr.content.type}
          </label>
          <select
            id="type"
            name="type"
            className="block w-full rounded-md border border-border-strong bg-bg-default px-3 py-2 text-base"
          >
            {types.map((t) => (
              <option key={t} value={t}>
                {tr.content.types[t]}
              </option>
            ))}
          </select>
        </div>
        <Field id="title" label={tr.content.titleField} required minLength={5} maxLength={120} />
        <SubmitButton>{tr.content.newContent}</SubmitButton>
      </form>
    </div>
  );
}
