import type { Metadata } from 'next';
import { tr } from '@incelemeler/i18n';
import { Alert, Field, PageTitle, SubmitButton } from '../../../components/ui';
import { errorMessage } from '../../../lib/errors';
import { api, requireStaff } from '../../../lib/session';
import { updateHomeModuleAction } from './actions';

const T = tr.homeAdmin;
export const metadata: Metadata = { title: T.title };
export const dynamic = 'force-dynamic';

/** `datetime-local` alanı için Türkiye saati (UTC+3). */
function local(iso: string | null): string {
  return iso ? new Date(new Date(iso).getTime() + 3 * 3_600_000).toISOString().slice(0, 16) : '';
}

/** Ana sayfa düzenleyici (REQ-ADM-006): sıra, görünürlük, veri kaynağı; sponsorlu sınırları API'de zorlanır. */
export default async function HomeEditorPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string; hata?: string; alan?: string }>;
}) {
  const { token, user } = await requireStaff();
  const sp = await searchParams;
  if (!user.permissions.includes('content.publish')) {
    return (
      <div className="max-w-2xl space-y-4">
        <PageTitle>{T.title}</PageTitle>
        <Alert kind="info">{tr.admin.noPermission}</Alert>
      </div>
    );
  }
  const client = await api(token);
  const [{ data }, { data: preview }] = await Promise.all([
    client.GET('/v1/admin/home-modules'),
    client.GET('/v1/home', { params: { query: {} } }),
  ]);
  const fieldError =
    sp.alan && sp.alan in T.errors ? T.errors[sp.alan as keyof typeof T.errors] : null;
  return (
    <div className="max-w-4xl space-y-6 rounded-lg border border-border-default bg-bg-default p-6">
      <div className="space-y-1">
        <PageTitle>{T.title}</PageTitle>
        <p className="text-sm text-text-secondary">{T.intro}</p>
      </div>
      {sp.durum === 'kaydedildi' ? <Alert kind="success">{T.saved}</Alert> : null}
      {sp.hata ? <Alert kind="error">{fieldError ?? errorMessage(sp.hata)}</Alert> : null}
      <ol className="space-y-4" data-testid="home-modules">
        {data?.data.map((m) => (
          <li key={m.id} className="rounded-md border border-border-default p-4">
            <form
              action={updateHomeModuleAction}
              aria-label={`${T.types[m.type]}: ${m.title}`}
              className="grid gap-3 sm:grid-cols-2"
            >
              <input type="hidden" name="id" value={m.id} />
              <input type="hidden" name="type" value={m.type} />
              <input type="hidden" name="version" value={m.version} />
              <p className="text-sm text-text-secondary sm:col-span-2">
                {T.types[m.type]} · {T.sources[m.source]}
              </p>
              <Field
                id={`title-${m.id}`}
                name="title"
                label={T.moduleTitle}
                defaultValue={m.title}
              />
              <Field
                id={`position-${m.id}`}
                name="position"
                type="number"
                label={T.position}
                defaultValue={String(m.position)}
              />
              <Field
                id={`min-${m.id}`}
                name="minItems"
                type="number"
                label={T.minItems}
                defaultValue={String(m.minItems)}
              />
              <Field
                id={`max-${m.id}`}
                name="maxItems"
                type="number"
                label={T.maxItems}
                defaultValue={String(m.maxItems)}
              />
              {m.type === 'CATEGORY_POPULAR' || m.type === 'SEASONAL' ? (
                <Field
                  id={`cat-${m.id}`}
                  name="categorySlug"
                  label={T.categorySlug}
                  defaultValue={m.config.categorySlug ?? ''}
                />
              ) : null}
              {m.type === 'EDITORS_PICKS' ? (
                <>
                  <Field
                    id={`listings-${m.id}`}
                    name="listingSlugs"
                    label={T.listingSlugs}
                    defaultValue={(m.config.listingSlugs ?? []).join(', ')}
                  />
                  <Field
                    id={`articles-${m.id}`}
                    name="articleSlugs"
                    label={T.articleSlugs}
                    defaultValue={(m.config.articleSlugs ?? []).join(', ')}
                  />
                </>
              ) : null}
              <Field
                id={`province-${m.id}`}
                name="provinceSlug"
                label={T.provinceSlug}
                defaultValue={m.provinceSlug ?? ''}
              />
              <Field
                id={`from-${m.id}`}
                name="visibleFrom"
                type="datetime-local"
                label={T.visibleFrom}
                defaultValue={local(m.visibleFrom)}
              />
              <Field
                id={`until-${m.id}`}
                name="visibleUntil"
                type="datetime-local"
                label={T.visibleUntil}
                defaultValue={local(m.visibleUntil)}
              />
              <div className="flex items-center gap-2">
                <input
                  id={`enabled-${m.id}`}
                  name="enabled"
                  type="checkbox"
                  value="1"
                  defaultChecked={m.enabled}
                  className="h-5 w-5"
                />
                <label htmlFor={`enabled-${m.id}`} className="text-sm">
                  {T.enabled}
                </label>
              </div>
              <div className="sm:col-span-2">
                <SubmitButton>{T.save}</SubmitButton>
              </div>
            </form>
          </li>
        ))}
      </ol>
      <section aria-labelledby="onizleme" className="space-y-2" data-testid="home-preview">
        <h2 id="onizleme" className="text-lg font-semibold">
          {T.preview}
        </h2>
        <p className="text-sm text-text-secondary">{T.previewHidden}</p>
        <ol className="list-decimal space-y-1 pl-6 text-sm">
          {preview?.modules.map((m) => (
            <li key={m.key}>
              <strong>{m.title}</strong>: {m.cards.map((c) => c.title).join(', ')}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
