import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Hub } from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { articlePath, STATIC_PATHS } from '@incelemeler/routes';
import { lowerTr, upperTr, withCase } from '@incelemeler/utils';
import { serverApi } from '../../lib/api';
import { canonical, jsonLdScript, robots } from '../../lib/seo';
import { breadcrumbJsonLd } from '../listing/json-ld';
import { PageEvents } from '../analytics/page-events';
import { CommercialLabel } from '../sponsored/label';
import { SponsoredCard } from '../sponsored/sponsored-card';
import { mergeSponsored } from '../../lib/sponsored';

const H = tr.hub;
export type HubParams = { il: string; bolum?: string; kategori?: string };
export type HubProps = {
  params: Promise<HubParams>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const fill = (t: string, v: Record<string, string | number>) =>
  Object.entries(v).reduce((acc, [k, x]) => acc.replaceAll(`{${k}}`, String(x)), t);
const capitalize = (s: string) => (s ? upperTr(s[0]!) + s.slice(1) : s);

function pageOf(sp: Record<string, string | string[] | undefined>): number {
  const raw = Array.isArray(sp.sayfa) ? sp.sayfa[0] : sp.sayfa;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= 50 ? n : 1;
}

async function load(props: HubProps): Promise<{ hub: Hub; page: number } | null> {
  const { il, bolum, kategori } = await props.params;
  const page = pageOf(await props.searchParams);
  const { data } = await serverApi().GET('/v1/hubs', {
    params: {
      query: {
        province: il,
        ...(bolum ? { segment: bolum } : {}),
        ...(kategori ? { category: kategori } : {}),
        page,
      },
    },
  });
  return data ? { hub: data, page } : null;
}

/** Programatik başlık (REQ-YRL-002): ek üretilemezse eksiz kalıba düşer. */
export function hubTitle(h: Hub): string {
  const place = h.district?.name ?? h.province.name;
  if (!h.category) {
    return h.district
      ? fill(H.districtTitle, { ilce: h.district.name, il: h.province.name })
      : fill(H.provinceTitle, { il: h.province.name });
  }
  const locative = withCase(place, 'locative');
  return locative
    ? fill(H.categoryTitle, { yerde: locative, kategori: lowerTr(h.category.name) })
    : fill(H.categoryTitleFallback, { Kategori: h.category.name, yer: place });
}

export async function hubMetadata(props: HubProps): Promise<Metadata> {
  const loaded = await load(props);
  if (!loaded) return { title: tr.common.notFound, robots: { index: false, follow: true } };
  const { hub, page } = loaded;
  const title = capitalize(hubTitle(hub)).slice(0, 60);
  const description = (
    hub.category
      ? fill(H.categoryDescription, {
          yer: hub.district?.name ?? hub.province.name,
          kategori: lowerTr(hub.category.name),
          n: hub.listingCount,
        })
      : fill(H.provinceDescription, { il: hub.district?.name ?? hub.province.name })
  ).slice(0, 155);
  return {
    title,
    description,
    alternates: { canonical: canonical(hub.path) },
    // Sayfalama varyantları noindex,follow (REQ-SEO-004); yalnız demo içeren hub kapalı (AK-03).
    robots: robots(page === 1 && !hub.demoOnly),
    openGraph: { type: 'website', locale: 'tr_TR', siteName: tr.brand.name, title, description },
  };
}

/** Destinasyon/keşif hub'ı (Ek A15.1, REQ-SEO-010/011): sunucuda render, organik sıra, iç bağlantılar. */
export async function HubRoute(props: HubProps) {
  const loaded = await load(props);
  if (!loaded) notFound();
  const { hub, page } = loaded;
  const title = capitalize(hubTitle(hub));
  const crumbs = [
    { name: tr.article.home, url: canonical('/') },
    ...hub.parents.map((p) => ({ name: p.label, url: canonical(p.path) })),
    { name: title, url: canonical(hub.path) },
  ];
  const items = hub.listings.filter((l) => l.dataOrigin !== 'DEMO');
  const itemList = items.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: title,
        itemListElement: items.map((l, i) => ({
          '@type': 'ListItem',
          position: (page - 1) * hub.pageSize + i + 1,
          url: canonical(l.path),
          name: l.title,
        })),
      }
    : null;
  const pages = Math.ceil(hub.listingCount / hub.pageSize);
  const searchHref = `/ara?il=${hub.province.slug}${hub.district ? `&ilce=${hub.district.slug}` : ''}${
    hub.category ? `&kategori=${hub.category.slug}` : ''
  }`;

  return (
    <div className="space-y-8" data-testid="hub-page">
      <PageEvents name="category_viewed" props={{ hubPath: hub.path }} demo={hub.demoOnly} />
      {hub.demoOnly ? null : (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd(crumbs)) }}
        />
      )}
      {itemList ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(itemList) }}
        />
      ) : null}
      <nav aria-label={tr.article.breadcrumb} className="text-sm text-text-secondary">
        <ol className="flex flex-wrap gap-1">
          <li>
            <Link href="/" className="underline">
              {tr.article.home}
            </Link>{' '}
            ›
          </li>
          {hub.parents.map((p) => (
            <li key={p.path}>
              <Link href={p.path} className="underline">
                {p.label}
              </Link>{' '}
              ›
            </li>
          ))}
          <li aria-current="page">{title}</li>
        </ol>
      </nav>
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="text-text-secondary">{fill(H.listingCount, { n: hub.listingCount })}</p>
        <p className="text-sm">
          {H.organicNote}{' '}
          <Link href={STATIC_PATHS.methodology} className="underline">
            {H.methodology}
          </Link>{' '}
          ·{' '}
          <Link href={searchHref} className="underline" rel="nofollow">
            {H.searchHere}
          </Link>
        </p>
      </header>

      {hub.children.length ? (
        <section aria-labelledby="kesfet" className="space-y-3">
          <h2 id="kesfet" className="text-xl font-semibold">
            {H.children}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {hub.children.map((c) => (
              <li key={c.path}>
                <Link
                  href={c.path}
                  className="inline-flex min-h-11 items-center rounded-full border border-border-strong px-3 text-sm"
                >
                  {c.label} ({c.count})
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {hub.articles.length ? (
        <section aria-labelledby="yazilar" className="space-y-3">
          <h2 id="yazilar" className="text-xl font-semibold">
            {H.articles}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {hub.articles.map((a) => (
              <li key={a.slug} className="rounded-lg border border-border-default p-4">
                <Link href={articlePath(a)} className="font-medium text-brand-default underline">
                  {a.title}
                </Link>
                {a.summary ? <p className="text-sm text-text-secondary">{a.summary}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="listelemeler" className="space-y-3">
        <h2 id="listelemeler" className="text-xl font-semibold">
          {H.listings}
        </h2>
        <ol className="grid gap-3 sm:grid-cols-2" data-testid="hub-listings">
          {mergeSponsored(hub.listings, hub.sponsored).map((m) => {
            if (m.kind === 'sponsored') {
              return <SponsoredCard key={m.sponsored.placementId} s={m.sponsored} />;
            }
            const l = m.hit;
            return (
              <li key={l.id} className="rounded-lg border border-border-default p-4">
                <Link href={l.path} className="font-semibold text-brand-default underline">
                  <CommercialLabel commercial={l.commercial} />
                  {l.title}
                </Link>
                <p className="text-sm text-text-secondary">
                  {[l.subtitle, l.priceLevel ? '₺'.repeat(l.priceLevel) : null]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                {l.status === 'CLOSED_PERMANENTLY' ? (
                  <p className="text-sm font-medium">{tr.search.closed}</p>
                ) : (
                  <p className="text-sm">{tr.search.noReviews}</p>
                )}
              </li>
            );
          })}
        </ol>
        {pages > 1 ? (
          <nav aria-label={fill(tr.search.page, { n: page })} className="flex justify-between">
            {page > 1 ? (
              <Link
                href={page === 2 ? hub.path : `${hub.path}?sayfa=${page - 1}`}
                className="min-h-11 content-center underline"
              >
                {H.prev}
              </Link>
            ) : (
              <span />
            )}
            {page < pages ? (
              <Link
                href={`${hub.path}?sayfa=${page + 1}`}
                className="min-h-11 content-center underline"
              >
                {H.next}
              </Link>
            ) : null}
          </nav>
        ) : null}
      </section>
    </div>
  );
}
