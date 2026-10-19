import type { Metadata } from 'next';
import Link from 'next/link';
import type { SearchHit, SearchResponse } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { STATIC_PATHS } from '@incelemeler/routes';
import { FilterSheet } from '../../components/search/filter-sheet';
import { SearchBox } from '../../components/search/search-box';
import { serverApi } from '../../lib/api';
import {
  activeFilterCount,
  EMPTY_STATE,
  explicitChips,
  interpretationChips,
  parseState,
  relaxHref,
  searchHref,
  toApiQuery,
  type Chip,
  type SearchState,
} from '../../lib/search-state';

const S = tr.search;
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// Arama sonuçları her istekte; arama motorlarına kapalı ama taranabilir (REQ-SEO-005: noindex, Disallow yok).
export const dynamic = 'force-dynamic';

export async function generateMetadata(props: Props): Promise<Metadata> {
  const s = parseState(await props.searchParams);
  return {
    title: s.q ? `${s.q.slice(0, 40)} · ${S.title}` : S.title,
    robots: { index: false, follow: true },
  };
}

const price = (n: number) => '₺'.repeat(n);
const fill = (t: string, v: Record<string, string | number>) =>
  Object.entries(v).reduce((acc, [k, x]) => acc.replace(`{${k}}`, String(x)), t);

function Chips({ chips, label }: { chips: Chip[]; label: string }) {
  if (!chips.length) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label={label}>
      {chips.map((c) => (
        <li key={c.id}>
          <Link
            href={c.href}
            rel="nofollow"
            aria-label={fill(S.removeChip, { label: c.label })}
            className="inline-flex min-h-11 items-center gap-1 rounded-full border border-border-strong px-3 text-sm"
          >
            {c.label} <span aria-hidden="true">✕</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Hit({ h }: { h: SearchHit }) {
  const typeLabel =
    h.type === 'ARTICLE'
      ? h.articleType
        ? tr.article.typePlural[h.articleType]
        : ''
      : h.kind
        ? S.kinds[h.kind]
        : '';
  return (
    <li className="rounded-lg border border-border-default p-4" data-testid="search-hit">
      <h3 className="font-semibold">
        <Link href={h.path} className="text-brand-default underline">
          {h.title}
        </Link>
      </h3>
      <p className="text-sm text-text-secondary">
        {[
          typeLabel,
          h.subtitle,
          h.priceLevel ? price(h.priceLevel) : null,
          h.distanceKm !== null
            ? fill(S.distance, { km: h.distanceKm.toLocaleString('tr-TR') })
            : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>
      {h.status === 'CLOSED_PERMANENTLY' ? (
        <p className="text-sm font-medium">{S.closed}</p>
      ) : h.type === 'LISTING' && h.ratingCount === 0 ? (
        <p className="text-sm">{S.noReviews}</p>
      ) : null}
    </li>
  );
}

const selectClass =
  'block min-h-11 w-full rounded-md border border-border-strong bg-bg-default px-3 text-base';

/** Arama sonuçları (REQ-ARA-007…013): sunucuda render; filtreler URL'de. */
export default async function SearchPage(props: Props) {
  const s = parseState(await props.searchParams);
  const api = serverApi();
  const hasInput = Boolean(s.q) || activeFilterCount(s) > 0;
  const [resultRes, categoriesRes, provincesRes, filtersRes] = await Promise.all([
    hasInput
      ? api.GET('/v1/search', { params: { query: toApiQuery(s) as never } })
      : Promise.resolve({ data: undefined, error: undefined }),
    api.GET('/v1/categories', { params: { query: { limit: 100 } } }),
    api.GET('/v1/admin-areas', { params: { query: { level: 'PROVINCE' } } }),
    api.GET('/v1/search/filters'),
  ]);
  const result: SearchResponse | undefined = resultRes.data;
  const categories = categoriesRes.data?.data ?? [];
  const provinces = provincesRes.data?.data ?? [];
  const province = provinces.find((p) => p.slug === s.il);
  const districts = province
    ? ((
        await api.GET('/v1/admin-areas', {
          params: { query: { level: 'DISTRICT', parentId: province.id } },
        })
      ).data?.data ?? [])
    : [];
  const attributes = (filtersRes.data?.attributes ?? []).filter((a) => a.type === 'BOOL');
  const attrLabel = (pair: string) => {
    const [key, value] = pair.split(':');
    const def = attributes.find((a) => a.key === key);
    return def ? (value === 'false' ? `${def.label}: ✕` : def.label) : pair;
  };

  const chips = [
    ...(result ? interpretationChips(s, result.interpretation, { price }) : []),
    ...explicitChips(s, {
      il: province?.name,
      ilce: districts.find((d) => d.slug === s.ilce)?.name,
      kategori: categories.find((c) => c.slug === s.kategori)?.name,
      tur: s.tur ? S.kinds[s.tur] : undefined,
      icerik: s.icerik ? S.contentTypes[s.icerik] : undefined,
      fiyat: s.fiyat !== null ? price(s.fiyat) : undefined,
      puan: s.puan ? S.ratingOptions[s.puan] : undefined,
      ozellik: attrLabel,
    }),
  ];
  const roots = categories.filter((c) => c.parentId === null);
  const pages = result ? Math.ceil(result.total / result.pageSize) : 0;
  const pageHref = (n: number): string => searchHref({ ...s, sayfa: n } satisfies SearchState);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{S.title}</h1>
      <SearchBox defaultValue={s.q} />
      <div className="grid gap-6 md:grid-cols-[18rem_1fr]">
        <aside>
          <FilterSheet
            activeCount={activeFilterCount(s)}
            total={result?.total ?? 0}
            clearHref={searchHref({ ...EMPTY_STATE, q: s.q })}
          >
            {s.q ? <input type="hidden" name="q" value={s.q} /> : null}
            {!s.yorumla ? <input type="hidden" name="yorumla" value="hayir" /> : null}
            <label className="block space-y-1 text-sm">
              <span className="font-medium">{S.province}</span>
              <select name="il" defaultValue={s.il ?? ''} className={selectClass}>
                <option value="">{S.any}</option>
                {provinces.map((p) => (
                  <option key={p.id} value={p.slug}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            {districts.length ? (
              <label className="block space-y-1 text-sm">
                <span className="font-medium">{S.district}</span>
                <select name="ilce" defaultValue={s.ilce ?? ''} className={selectClass}>
                  <option value="">{S.any}</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.slug}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="block space-y-1 text-sm">
              <span className="font-medium">{S.category}</span>
              <select name="kategori" defaultValue={s.kategori ?? ''} className={selectClass}>
                <option value="">{S.any}</option>
                {roots.map((r) => (
                  <optgroup key={r.id} label={r.name}>
                    <option value={r.slug}>{r.name}</option>
                    {categories
                      .filter((c) => c.parentId === r.id)
                      .map((c) => (
                        <option key={c.id} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">{S.contentType}</span>
              <select name="icerik" defaultValue={s.icerik ?? ''} className={selectClass}>
                <option value="">{S.any}</option>
                <option value="LISTING">{S.contentTypes.LISTING}</option>
                <option value="ARTICLE">{S.contentTypes.ARTICLE}</option>
              </select>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">{S.priceMax}</span>
              <select name="fiyat" defaultValue={s.fiyat ?? ''} className={selectClass}>
                <option value="">{S.any}</option>
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {price(n)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">{S.minRating}</span>
              <select name="puan" defaultValue={s.puan ?? ''} className={selectClass}>
                <option value="">{S.any}</option>
                {(['3.5', '4', '4.5'] as const).map((r) => (
                  <option key={r} value={r}>
                    {S.ratingOptions[r]}
                  </option>
                ))}
              </select>
            </label>
            {attributes.length ? (
              <fieldset className="space-y-1 text-sm">
                <legend className="font-medium">{S.features}</legend>
                {attributes.map((a) => (
                  <label key={a.key} className="flex min-h-11 items-center gap-2">
                    <input
                      type="checkbox"
                      name="ozellik"
                      value={`${a.key}:true`}
                      defaultChecked={s.ozellik.includes(`${a.key}:true`)}
                      className="h-5 w-5"
                    />
                    {a.label}
                  </label>
                ))}
              </fieldset>
            ) : null}
            <label className="block space-y-1 text-sm">
              <span className="font-medium">{S.sort}</span>
              <select name="sirala" defaultValue={s.sirala} className={selectClass}>
                {(['recommended', 'rating', 'reviews', 'newest'] as const).map((o) => (
                  <option key={o} value={o}>
                    {S.sorts[o]}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-sm">
              <Link href={STATIC_PATHS.methodology} className="underline">
                {S.sortHelp}
              </Link>
            </p>
          </FilterSheet>
        </aside>

        <section aria-labelledby="sonuclar" className="space-y-4">
          {!result ? (
            <p className="text-text-secondary">{S.noQuery}</p>
          ) : (
            <>
              <h2 id="sonuclar" className="text-lg font-semibold">
                {s.q
                  ? fill(S.resultsFor, { q: s.q, n: result.total })
                  : fill(S.results, { n: result.total })}
              </h2>
              {chips.length ? (
                <div className="space-y-2">
                  {result.interpretation.place ||
                  result.interpretation.category ||
                  result.interpretation.intents.length ? (
                    <p className="text-sm text-text-secondary">{S.interpreted}</p>
                  ) : null}
                  <Chips chips={chips} label={S.filters} />
                </div>
              ) : null}
              {result.interpretation.didYouMean ? (
                <p className="text-sm" data-testid="did-you-mean">
                  {S.didYouMean}{' '}
                  <Link
                    href={searchHref({ ...EMPTY_STATE, q: result.interpretation.didYouMean })}
                    rel="nofollow"
                    className="font-medium text-brand-default underline"
                  >
                    {result.interpretation.didYouMean}
                  </Link>
                </p>
              ) : null}
              {result.fuzzyFallback ? (
                <p className="text-sm text-text-secondary">{S.fuzzyNote}</p>
              ) : null}
              {result.total === 0 ? (
                <div
                  className="space-y-2 rounded-lg border border-border-default p-4"
                  data-testid="zero-results"
                >
                  <h3 className="font-semibold">{S.zeroTitle}</h3>
                  {result.relaxations.length ? (
                    <>
                      <p>{S.zeroHint}</p>
                      <ul className="space-y-1">
                        {result.relaxations.map((r) => (
                          <li key={r.drop}>
                            <Link
                              href={relaxHref(s, result.interpretation, r.drop)}
                              rel="nofollow"
                              className="text-brand-default underline"
                            >
                              {fill(S.relax, {
                                label: r.drop.startsWith('attr:')
                                  ? attrLabel(`${r.label}:true`)
                                  : r.label,
                                n: r.count,
                              })}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p>{S.zeroNoRelax}</p>
                  )}
                </div>
              ) : (
                <ol className="space-y-3">
                  {result.data.map((h) => (
                    <Hit key={`${h.type}-${h.id}`} h={h} />
                  ))}
                </ol>
              )}
              {pages > 1 ? (
                <nav aria-label={fill(S.page, { n: s.sayfa })} className="flex justify-between">
                  {s.sayfa > 1 ? (
                    <Link
                      href={pageHref(s.sayfa - 1)}
                      rel="nofollow prev"
                      className="min-h-11 content-center underline"
                    >
                      {S.prev}
                    </Link>
                  ) : (
                    <span />
                  )}
                  {s.sayfa < pages ? (
                    <Link
                      href={pageHref(s.sayfa + 1)}
                      rel="nofollow next"
                      className="min-h-11 content-center underline"
                    >
                      {S.next}
                    </Link>
                  ) : null}
                </nav>
              ) : null}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
