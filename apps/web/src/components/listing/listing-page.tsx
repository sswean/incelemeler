import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import {
  ctasFor,
  type CtaType,
  type ListingKind,
  type PublicListing,
} from '@incelemeler/contracts';
import { tr } from '@incelemeler/i18n';
import { listingPath } from '@incelemeler/routes';
import { formatDate, formatLongDate, withCase } from '@incelemeler/utils';
import { serverApi } from '../../lib/api';
import { canonical, jsonLdScript, robots } from '../../lib/seo';
import { breadcrumbJsonLd, listingJsonLd } from './json-ld';

const T = tr.listingPage;
type Props = { params: Promise<{ slug: string }> };

/** Tür başına bilgilerin tazelik eşiği (gün) — REQ-LST-005. */
const FRESHNESS_DAYS: Partial<Record<ListingKind, number>> = {
  PLACE: 90,
  LODGING: 180,
  PRODUCT: 7,
  EVENT: 7,
};
/** Yeme-içme dalındaki mekanlar schema.org Restaurant olarak işaretlenir. */
const RESTAURANT_ROOT = 'yeme-icme';

async function load(slug: string): Promise<PublicListing | null> {
  const { data } = await serverApi().GET('/v1/listings/{slug}', {
    params: { path: { slug } },
  });
  return data ?? null;
}

function mediaUrl(id: string) {
  return canonical(`/medya/${id}`);
}

function placeText(l: PublicListing): string | null {
  const loc = l.location;
  if (!loc) return null;
  return [loc.district?.name, loc.province.name].filter(Boolean).join(', ');
}

/** Başlık ≤ 60, açıklama ≤ 155 karakter hedefi (REQ-SEO-002); bulunma eki A15.2 yardımcısıyla. */
export async function listingMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params;
  const l = await load(slug);
  if (!l) return { title: tr.common.notFound, robots: { index: false, follow: true } };
  const place = placeText(l);
  const title = (place ? `${l.name} – ${place}` : `${l.name} – ${l.category.name}`).slice(0, 60);
  const where = l.location
    ? (withCase(l.location.district?.name ?? l.location.province.name, 'locative') ?? place)
    : null;
  const description = (
    l.shortDescription ??
    `${l.name}${where ? `, ${where}` : ''}: ${l.category.name}. Adres, iletişim ve özellikler.`
  ).slice(0, 155);
  const path = listingPath({ kind: l.kind, slug: l.slug, carRental: l.carRental });
  const primary = l.media.find((m) => m.role === 'PRIMARY') ?? l.media[0];
  return {
    title,
    description,
    alternates: { canonical: canonical(path) },
    robots: robots(l.dataOrigin !== 'DEMO'),
    openGraph: {
      type: 'website',
      locale: 'tr_TR',
      siteName: tr.brand.name,
      title,
      description,
      url: canonical(path),
      ...(primary
        ? {
            images: [
              {
                url: mediaUrl(primary.id),
                width: primary.width,
                height: primary.height,
                alt: primary.altText,
              },
            ],
          }
        : {}),
    },
  };
}

function ctaHref(type: CtaType, l: PublicListing): string | null {
  const loc = l.location;
  switch (type) {
    case 'DIRECTIONS':
      return loc?.latitude != null
        ? `https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`
        : null;
    case 'CALL':
    case 'CONTACT':
      return l.contacts.phone ? `tel:${l.contacts.phone.replace(/[^+\d]/g, '')}` : null;
    case 'WEBSITE':
    case 'OFFICIAL_SITE':
      return l.contacts.website ?? null;
    case 'RESERVATION':
    case 'APPOINTMENT':
      return l.contacts.reservationUrl ?? null;
    default:
      return null;
  }
}

function Placeholder({ name }: { name: string }) {
  return (
    <div
      role="img"
      aria-label={T.noPhoto}
      className="flex aspect-[16/9] w-full items-center justify-center rounded-lg bg-bg-subtle text-6xl font-semibold text-text-secondary"
    >
      <span aria-hidden="true">{name.trim().charAt(0).toLocaleUpperCase('tr-TR')}</span>
    </div>
  );
}

/**
 * Listeleme detay şablonu (REQ-LST-001…006, REQ-SEO-001/008/010): sunucuda render; ilk ekranda ad,
 * tür/kategori, konum, puan özeti, fiyat seviyesi ve birincil CTA.
 */
export async function ListingPage(
  props: Props,
  kinds: readonly ListingKind[],
  carRentalRoute = false,
) {
  const { slug } = await props.params;
  const l = await load(slug);
  if (!l) notFound();
  const path = listingPath({ kind: l.kind, slug: l.slug, carRental: l.carRental });
  if (!kinds.includes(l.kind) || l.carRental !== carRentalRoute) permanentRedirect(path);

  const closed = l.status === 'CLOSED_PERMANENTLY' || l.status === 'CLOSED_TEMPORARILY';
  const ctas = ctasFor({
    kind: l.kind,
    status: l.status,
    hasCoordinates: l.location?.latitude != null,
    phone: l.contacts.phone,
    website: l.contacts.website,
    reservationUrl: l.contacts.reservationUrl,
  });
  const primary = l.media.find((m) => m.role === 'PRIMARY') ?? l.media[0];
  const gallery = l.media.filter((m) => m !== primary);
  const restaurant = l.categoryPath.some((c) => c.slug === RESTAURANT_ROOT);
  const ld = listingJsonLd(l, canonical(path), mediaUrl, restaurant);
  const crumbs = [
    { name: T.home, url: canonical('/') },
    { name: l.name, url: canonical(path) },
  ];
  const verified = l.sourceVerifiedAt ? new Date(l.sourceVerifiedAt) : null;
  const limit = FRESHNESS_DAYS[l.kind] ?? 180;
  const stale = verified ? Date.now() - verified.getTime() > limit * 86_400_000 : false;
  const loc = l.location;
  const d = l.details;
  const facts: Array<[string, string]> = [];
  if (d.lodging?.checkInTime) facts.push([T.checkIn, d.lodging.checkInTime]);
  if (d.lodging?.checkOutTime) facts.push([T.checkOut, d.lodging.checkOutTime]);
  if (d.product) {
    facts.push([T.brand, d.product.brand], [T.model, d.product.model]);
    if (d.product.gtin) facts.push([T.gtin, d.product.gtin]);
    if (d.product.releaseDate)
      facts.push([T.releaseDate, formatLongDate(new Date(d.product.releaseDate))]);
  }
  if (d.experience?.durationMinutes) {
    facts.push([T.duration, T.minutes.replace('{n}', String(d.experience.durationMinutes))]);
  }
  if (d.experience?.startPoint) facts.push([T.startPoint, d.experience.startPoint]);
  if (d.event?.startsAt) facts.push([T.startsAt, formatLongDate(new Date(d.event.startsAt))]);
  if (d.event?.endsAt) facts.push([T.endsAt, formatLongDate(new Date(d.event.endsAt))]);
  if (d.guide?.languages?.length)
    facts.push([T.languages, d.guide.languages.join(', ').toUpperCase()]);
  const showPrice = l.kind === 'PLACE' || l.kind === 'LODGING' || l.kind === 'SERVICE_PROVIDER';

  return (
    <article className="mx-auto max-w-3xl space-y-8" data-testid="listing-page">
      {ld ? (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: jsonLdScript(ld) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd(crumbs)) }}
          />
        </>
      ) : null}
      <nav aria-label={T.breadcrumb} className="text-sm text-text-secondary">
        <ol className="flex flex-wrap gap-1">
          <li>
            <Link href="/" className="underline">
              {T.home}
            </Link>{' '}
            ›
          </li>
          {l.categoryPath.map((c) => (
            <li key={c.slug}>{c.name} ›</li>
          ))}
          <li aria-current="page">{l.name}</li>
        </ol>
      </nav>

      {l.dataOrigin === 'DEMO' ? (
        <p role="note" className="rounded-md border border-border-strong px-4 py-2 text-sm">
          {T.demoNotice}
        </p>
      ) : null}
      {closed ? (
        <p role="status" className="rounded-md border border-border-strong bg-bg-subtle px-4 py-3">
          <strong>
            {l.status === 'CLOSED_PERMANENTLY' ? T.closedPermanently : T.closedTemporarily}
          </strong>{' '}
          · {T.closedNote}
        </p>
      ) : null}

      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{l.name}</h1>
        <p className="text-text-secondary">
          {tr.taxonomy.kindLabels[l.kind]} · {l.category.name}
          {loc ? ` · ${placeText(l)}` : ''}
        </p>
        <p data-testid="rating-summary">{T.noReviews}</p>
        {showPrice ? (
          <p>
            {T.priceLevel}:{' '}
            {l.priceLevel ? (
              <span aria-label={`${l.priceLevel} / 4`}>{'₺'.repeat(l.priceLevel)}</span>
            ) : (
              T.priceUnknown
            )}
          </p>
        ) : null}
        {ctas.length ? (
          <ul className="flex flex-wrap gap-3 pt-2" data-testid="listing-ctas">
            {ctas.map((c, i) => {
              const href = ctaHref(c, l);
              if (!href) return null;
              const external = href.startsWith('http');
              return (
                <li key={c}>
                  <a
                    href={href}
                    {...(external ? { target: '_blank', rel: 'nofollow noopener noreferrer' } : {})}
                    className={
                      i === 0
                        ? 'inline-flex min-h-11 items-center rounded-md bg-brand-default px-5 py-2 font-medium text-on-brand'
                        : 'inline-flex min-h-11 items-center rounded-md border border-border-strong px-5 py-2'
                    }
                  >
                    {T.cta[c as keyof typeof T.cta] ?? c}
                    {external ? <span className="sr-only"> {T.externalNote}</span> : null}
                  </a>
                </li>
              );
            })}
          </ul>
        ) : null}
      </header>

      {primary ? (
        <figure className="space-y-1">
          <Image
            src={`/medya/${primary.id}`}
            alt={primary.altText}
            width={primary.width}
            height={primary.height}
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="aspect-[16/9] w-full rounded-lg object-cover"
            style={{ objectPosition: `${primary.focalX * 100}% ${primary.focalY * 100}%` }}
          />
          <figcaption className="text-xs text-text-secondary">
            {T.photoCredit}: {primary.credit}
          </figcaption>
        </figure>
      ) : (
        <Placeholder name={l.name} />
      )}

      {l.description?.length || l.shortDescription ? (
        <section aria-labelledby="hakkinda" className="space-y-2">
          <h2 id="hakkinda" className="text-lg font-semibold">
            {T.about}
          </h2>
          {(l.description?.length ? l.description.map((b) => b.text) : [l.shortDescription!]).map(
            (p, i) => (
              <p key={i}>{p}</p>
            ),
          )}
        </section>
      ) : null}

      {l.attributes.length || facts.length ? (
        <section aria-labelledby="ozellikler" className="space-y-2">
          <h2 id="ozellikler" className="text-lg font-semibold">
            {l.attributes.length ? T.features : T.details}
          </h2>
          <dl
            className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2"
            data-testid="listing-features"
          >
            {[...facts, ...l.attributes.map((a) => [a.label, a.display] as [string, string])].map(
              ([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between gap-4 border-b border-border-default py-1"
                >
                  <dt className="text-text-secondary">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ),
            )}
          </dl>
        </section>
      ) : null}

      {loc ? (
        <section aria-labelledby="konum" className="space-y-1">
          <h2 id="konum" className="text-lg font-semibold">
            {T.location}
          </h2>
          <address className="not-italic" data-testid="listing-address">
            {[loc.neighborhood, loc.addressLine].filter(Boolean).join(', ')}
            {loc.neighborhood || loc.addressLine ? <br /> : null}
            {[loc.postalCode, loc.district?.name].filter(Boolean).join(' ')}
            {loc.district ? ' / ' : ''}
            {loc.province.name}
          </address>
        </section>
      ) : null}

      {gallery.length ? (
        <section aria-labelledby="fotograflar" className="space-y-2">
          <h2 id="fotograflar" className="text-lg font-semibold">
            {T.photos}
          </h2>
          <ul className="grid grid-cols-2 gap-3">
            {gallery.map((m) => (
              <li key={m.id}>
                <figure>
                  <Image
                    src={`/medya/${m.id}`}
                    alt={m.altText}
                    width={m.width}
                    height={m.height}
                    sizes="(max-width: 768px) 50vw, 384px"
                    className="aspect-[4/3] w-full rounded object-cover"
                  />
                  <figcaption className="text-xs text-text-secondary">
                    {T.photoCredit}: {m.credit}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <footer className="space-y-1 border-t border-border-default pt-4 text-sm text-text-secondary">
        {verified ? (
          <p
            className={stale ? 'font-medium text-text-primary' : undefined}
            data-testid="verified-at"
          >
            {(stale ? T.staleWarning : T.verifiedAt).replace('{date}', formatDate(verified))}
          </p>
        ) : null}
      </footer>
    </article>
  );
}
