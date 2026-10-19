import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ArticleStatus } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { formatDate } from '@incelemeler/utils';
import { Alert, PageTitle } from '../../../../components/ui';
import { errorMessage } from '../../../../lib/errors';
import { api, requireStaff } from '../../../../lib/session';
import { correctionAction, transitionArticleAction } from '../actions';
import { ArticleEditor } from './article-editor';
import { PreviewButton } from './preview-button';

export const metadata: Metadata = { title: tr.content.title };
export const dynamic = 'force-dynamic';

const C = tr.content;
const TRANSITIONS: Record<ArticleStatus, ArticleStatus[]> = {
  DRAFT: ['IN_REVIEW'],
  IN_REVIEW: ['DRAFT', 'APPROVED'],
  APPROVED: ['DRAFT', 'SCHEDULED', 'PUBLISHED'],
  SCHEDULED: ['APPROVED', 'PUBLISHED'],
  PUBLISHED: ['ARCHIVED'],
  ARCHIVED: ['DRAFT'],
};
type Blocker = keyof typeof C.blockers;
type FieldError = keyof typeof C.fieldErrors;

export default async function ArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ durum?: string; hata?: string }>;
}) {
  const { token, user } = await requireStaff();
  const { id } = await params;
  const { durum, hata } = await searchParams;
  const { data: a } = await (
    await api(token)
  ).GET('/v1/admin/articles/{id}', { params: { path: { id } } });
  if (!a) notFound();
  const editor = user.permissions.includes('content.publish');
  const transitions = TRANSITIONS[a.status].filter(
    (s) => editor || s === 'IN_REVIEW' || (a.status === 'IN_REVIEW' && s === 'DRAFT'),
  );
  const hataText = hata
    ? hata in C.blockers
      ? C.blockers[hata as Blocker]
      : hata in C.fieldErrors
        ? C.fieldErrors[hata as FieldError]
        : errorMessage(hata)
    : null;

  return (
    <div className="max-w-4xl space-y-8 rounded-lg border border-border-default bg-bg-default p-6">
      <div className="space-y-1">
        <PageTitle>{a.title}</PageTitle>
        <p className="text-sm text-text-secondary" data-testid="article-meta">
          {C.types[a.type]} · {tr.listings.status}: {C.statuses[a.status]} · {C.author}:{' '}
          {a.author.displayName}
          {a.editor ? ` · ${C.editor}: ${a.editor.displayName}` : ''}
          {a.publishedAt ? ` · ${formatDate(new Date(a.publishedAt))}` : ''}
        </p>
      </div>
      {durum === 'kaydedildi' ? <Alert kind="success">{tr.admin.saved}</Alert> : null}
      {hataText ? <Alert kind="error">{hataText}</Alert> : null}

      <section aria-labelledby="eksikler" className="space-y-3">
        <h2 id="eksikler" className="text-lg font-semibold">
          {C.blockersTitle}
        </h2>
        {a.blockers.length === 0 ? (
          <p className="text-sm text-success-text">{C.ready}</p>
        ) : (
          <ul className="list-disc space-y-1 pl-6 text-sm" data-testid="article-blockers">
            {a.blockers.map((b) => (
              <li key={`${b.pointer}-${b.code}`}>{C.blockers[b.code as Blocker] ?? b.code}</li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-end gap-3">
          {transitions.map((s) => (
            <form key={s} action={transitionArticleAction} className="flex items-end gap-2">
              <input type="hidden" name="id" value={a.id} />
              <input type="hidden" name="version" value={a.version} />
              <input type="hidden" name="to" value={s} />
              {s === 'SCHEDULED' ? (
                <label className="text-sm">
                  <span className="block font-medium">{C.scheduleAt}</span>
                  <input
                    type="datetime-local"
                    name="scheduledAt"
                    required
                    className="min-h-11 rounded-md border border-border-strong px-2"
                  />
                </label>
              ) : null}
              <button
                type="submit"
                className="min-h-11 rounded-md border border-border-strong px-4 text-sm"
              >
                {C.transitions[s]}
              </button>
            </form>
          ))}
          <PreviewButton id={a.id} />
        </div>
      </section>

      <ArticleEditor key={a.version} article={a} />

      {a.status === 'PUBLISHED' && editor ? (
        <form
          action={correctionAction}
          className="space-y-2 border-t border-border-default pt-6"
          aria-label={C.correction}
        >
          <input type="hidden" name="id" value={a.id} />
          <input type="hidden" name="version" value={a.version} />
          <label htmlFor="note" className="block text-sm font-medium">
            {C.correction}
          </label>
          <textarea
            id="note"
            name="note"
            rows={2}
            required
            minLength={5}
            maxLength={500}
            aria-describedby="note-ipucu"
            className="block w-full rounded-md border border-border-strong bg-bg-default px-3 py-2"
          />
          <p id="note-ipucu" className="text-sm text-text-secondary">
            {C.correctionHint}
          </p>
          <button
            type="submit"
            className="min-h-11 rounded-md border border-border-strong px-4 text-sm"
          >
            {C.correction}
          </button>
        </form>
      ) : null}
    </div>
  );
}
