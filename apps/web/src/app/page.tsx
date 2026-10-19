import Link from 'next/link';
import type { HomeResponse } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { HomeCardView } from '../components/home/home-card';
import { SearchBox } from '../components/search/search-box';
import { serverApi } from '../lib/api';

// Modüller her istekte: sponsorlu modül kampanya bitince hemen kalkar (REQ-SPN-005).
export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ il?: string | string[] }> };

/**
 * Ana sayfa (Ek A15.4): arama en üstte ve sabit; modüller panelde belirlenen sırayla. Kişiselleştirme yalnızca
 * açıkça seçilen il ile (`?il=`), davranışsal sinyal yok.
 */
export default async function HomePage({ searchParams }: Props) {
  const raw = (await searchParams).il;
  const il = typeof raw === 'string' && /^[a-z0-9-]{1,120}$/.test(raw) ? raw : undefined;
  const { data, response } = await serverApi()
    .GET('/v1/home', { params: { query: il ? { il } : {} } })
    .catch(() => ({ data: undefined as HomeResponse | undefined, response: undefined }));

  return (
    <div className="space-y-10">
      <section aria-labelledby="kesfet-baslik" className="space-y-4">
        <h1 id="kesfet-baslik" className="text-3xl font-semibold">
          {tr.home.exploreTitle}
        </h1>
        <SearchBox />
        {data?.province ? (
          <p className="text-sm" data-testid="city-context">
            {tr.home.cityContext.replace('{city}', data.province.name)} ·{' '}
            <Link href="/" className="underline">
              {tr.home.allCities}
            </Link>
          </p>
        ) : null}
      </section>
      {!data ? (
        <div role="alert" className="text-danger-text">
          <p>{tr.home.loadError}</p>
          {response?.headers.get('x-trace-id') ? (
            <p className="text-sm text-text-secondary">
              {tr.common.traceId}: {response.headers.get('x-trace-id')}
            </p>
          ) : null}
        </div>
      ) : (
        data.modules.map((m) =>
          m.type === 'CATEGORY_SHORTCUTS' ? (
            <section key={m.key} aria-label={m.title}>
              <ul
                data-testid="category-grid"
                className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
              >
                {m.cards.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={c.path}
                      className="block rounded-lg border border-border-default px-4 py-5 font-medium hover:bg-bg-subtle"
                    >
                      {c.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <section
              key={m.key}
              aria-labelledby={`modul-${m.key}`}
              className="space-y-3"
              data-testid={`home-module-${m.key}`}
            >
              <h2 id={`modul-${m.key}`} className="text-xl font-semibold">
                {m.title}
              </h2>
              <ul
                className={
                  m.type === 'CITY_PICKER' || m.type === 'TRUST_LINKS'
                    ? 'flex flex-wrap gap-3'
                    : 'grid gap-3 sm:grid-cols-2 lg:grid-cols-4'
                }
              >
                {m.cards.map((c) => (
                  <HomeCardView key={`${m.key}-${c.id}`} card={c} />
                ))}
              </ul>
            </section>
          ),
        )
      )}
    </div>
  );
}
