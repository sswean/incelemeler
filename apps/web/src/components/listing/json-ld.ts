import type { PublicListing } from '@incelemeler/contracts';

const TYPE: Record<string, string> = {
  PLACE: 'LocalBusiness',
  LODGING: 'LodgingBusiness',
  PRODUCT: 'Product',
  SERVICE_PROVIDER: 'LocalBusiness',
  GUIDE_PERSON: 'Person',
  EXPERIENCE: 'TouristTrip',
  POI: 'TouristAttraction',
  DESTINATION: 'TouristDestination',
  EVENT: 'Event',
};

/**
 * Listeleme JSON-LD'si (REQ-SEO-008): içeriğin gerçek türüyle eşleşen tip; yalnızca sayfada görünen veri.
 * Değerlendirme yokken `AggregateRating`/`Review` üretilmez; demo veride JSON-LD yok (null).
 */
export function listingJsonLd(
  l: PublicListing,
  url: string,
  mediaUrl: (id: string) => string,
  restaurant: boolean,
): Record<string, unknown> | null {
  if (l.dataOrigin === 'DEMO') return null;
  const type = l.kind === 'PLACE' && restaurant ? 'Restaurant' : TYPE[l.kind];
  if (!type) return null;
  const loc = l.location;
  const images = l.media.map((m) => mediaUrl(m.id));
  const base: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': type,
    name: l.name,
    url,
    ...(l.shortDescription ? { description: l.shortDescription } : {}),
    ...(images.length ? { image: images } : {}),
  };
  if (l.kind === 'PRODUCT') {
    const p = l.details.product;
    return {
      ...base,
      ...(p ? { brand: { '@type': 'Brand', name: p.brand }, model: p.model } : {}),
      ...(p?.gtin ? { gtin: p.gtin } : {}),
    };
  }
  if (l.kind === 'EVENT') {
    const e = l.details.event;
    return {
      ...base,
      ...(e?.startsAt ? { startDate: e.startsAt } : {}),
      ...(e?.endsAt ? { endDate: e.endsAt } : {}),
    };
  }
  return {
    ...base,
    ...(loc
      ? {
          address: {
            '@type': 'PostalAddress',
            ...(loc.addressLine ? { streetAddress: loc.addressLine } : {}),
            ...(loc.district ? { addressLocality: loc.district.name } : {}),
            addressRegion: loc.province.name,
            ...(loc.postalCode ? { postalCode: loc.postalCode } : {}),
            addressCountry: 'TR',
          },
          ...(loc.latitude !== null && loc.longitude !== null
            ? {
                geo: {
                  '@type': 'GeoCoordinates',
                  latitude: loc.latitude,
                  longitude: loc.longitude,
                },
              }
            : {}),
        }
      : {}),
    ...(l.contacts.phone ? { telephone: l.contacts.phone } : {}),
    ...(l.priceLevel ? { priceRange: '₺'.repeat(l.priceLevel) } : {}),
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}
