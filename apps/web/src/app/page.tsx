import { tr } from '@incelemeler/i18n';
import { serverApi } from '../lib/api';

// Kategoriler her istekte API'den okunur (Faz 0 yürüyen iskelet; ISR stratejisi ADR-0009).
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const { data, error, response } = await serverApi()
    .GET('/v1/categories', { params: { query: { limit: 100 } } })
    .catch(() => ({ data: undefined, error: true, response: undefined }));

  const topLevel = data?.data.filter((c) => c.parentId === null) ?? [];

  return (
    <div className="space-y-8">
      <p
        role="note"
        className="rounded-lg border border-border-default bg-bg-subtle px-4 py-3 text-sm text-text-secondary"
      >
        {tr.home.phaseNotice}
      </p>
      <section aria-labelledby="kesfet-baslik" className="space-y-4">
        <h1 id="kesfet-baslik" className="text-3xl font-semibold">
          {tr.home.exploreTitle}
        </h1>
        {error || !data ? (
          <div role="alert" className="text-danger-text">
            <p>{tr.home.loadError}</p>
            {response?.headers.get('x-trace-id') ? (
              <p className="text-sm text-text-secondary">
                {tr.common.traceId}: {response.headers.get('x-trace-id')}
              </p>
            ) : null}
          </div>
        ) : topLevel.length === 0 ? (
          <p className="text-text-secondary">{tr.home.exploreEmpty}</p>
        ) : (
          <ul
            data-testid="category-grid"
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
          >
            {topLevel.map((c) => (
              <li key={c.id}>
                <span className="block rounded-lg border border-border-default px-4 py-5 font-medium">
                  {c.name}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
