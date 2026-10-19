import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { tr } from '@incelemeler/i18n';
import { RatingSummaryView } from '../../../components/reviews/rating-summary';
import { ReviewListView } from '../../../components/reviews/review-list';
import { serverApi } from '../../../lib/api';
import { canonical } from '../../../lib/seo';

const R = tr.reviews;
type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};
const SORTS = ['newest', 'highest', 'lowest', 'documented'] as const;
type Sort = (typeof SORTS)[number];

export const dynamic = 'force-dynamic';

async function load(props: Props) {
  const { id } = await props.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const sp = await props.searchParams;
  const sort: Sort = SORTS.includes(sp.siralama as Sort) ? (sp.siralama as Sort) : 'newest';
  const rating = Number(sp.puan);
  const page = Number(sp.sayfa);
  const query = {
    sort,
    ...(Number.isInteger(rating) && rating >= 1 && rating <= 5 ? { rating } : {}),
    ...(Number.isInteger(page) && page > 1 && page <= 100 ? { page } : {}),
  };
  const api = serverApi();
  const [form, list] = await Promise.all([
    api.GET('/v1/listings/{id}/review-form', { params: { path: { id } } }),
    api.GET('/v1/listings/{id}/reviews', { params: { path: { id }, query } }),
  ]);
  if (!form.data || !list.data) return null;
  return {
    form: form.data,
    list: list.data,
    sort,
    rating: query.rating ?? null,
    page: query.page ?? 1,
  };
}

/** Sıralama/filtre varyantları arama motorlarına kapalı; canonical listeleme sayfası (REQ-SEO-004). */
export async function generateMetadata(props: Props): Promise<Metadata> {
  const d = await load(props);
  if (!d) return { title: tr.common.notFound, robots: { index: false } };
  return {
    title: `${R.title} · ${d.form.listing.name}`.slice(0, 60),
    alternates: { canonical: canonical(d.form.listing.path) },
    robots: { index: false, follow: true },
  };
}

export default async function ReviewsPage(props: Props) {
  const d = await load(props);
  if (!d) notFound();
  const { form, list } = d;
  const pages = Math.ceil(list.total / list.pageSize);
  const href = (p: number) =>
    `?siralama=${d.sort}${d.rating ? `&puan=${d.rating}` : ''}${p > 1 ? `&sayfa=${p}` : ''}`;
  const select = 'block min-h-11 rounded-md border border-border-strong bg-bg-default px-2';
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <p className="text-sm">
        <Link href={form.listing.path} className="underline">
          {form.listing.name}
        </Link>
      </p>
      <h1 className="text-2xl font-semibold">{R.title}</h1>
      <RatingSummaryView summary={list.summary} writeHref={`/degerlendir/${form.listing.id}`} />
      <form method="get" className="flex flex-wrap items-end gap-3" aria-label={R.sortAndFilter}>
        <label className="text-sm">
          <span className="block font-medium">{R.sort}</span>
          <select name="siralama" defaultValue={d.sort} className={select}>
            {SORTS.map((s) => (
              <option key={s} value={s}>
                {R.sorts[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block font-medium">{R.filterRating}</span>
          <select name="puan" defaultValue={d.rating ?? ''} className={select}>
            <option value="">{R.allRatings}</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {R.ratingLabels[n as 1 | 2 | 3 | 4 | 5]}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="min-h-11 rounded-md border border-border-strong px-4">
          {R.apply}
        </button>
      </form>
      <ReviewListView list={list} signedIn={false} />
      {pages > 1 ? (
        <nav
          aria-label={tr.search.page.replace('{n}', String(d.page))}
          className="flex justify-between"
        >
          {d.page > 1 ? (
            <Link
              href={href(d.page - 1)}
              rel="nofollow"
              className="min-h-11 content-center underline"
            >
              {tr.search.prev}
            </Link>
          ) : (
            <span />
          )}
          {d.page < pages ? (
            <Link
              href={href(d.page + 1)}
              rel="nofollow"
              className="min-h-11 content-center underline"
            >
              {tr.search.next}
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
