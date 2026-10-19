import type { AttributeDefinition, ListingDetailsInput, ListingKind } from '@incelemeler/contracts';

export interface Issue {
  pointer: string;
  code: string;
}

export interface PublishInput {
  kind: ListingKind;
  shortDescription: string | null;
  categoryPublished: boolean;
  dataOrigin: string;
  appEnv: string;
  contacts: Record<string, unknown>;
  location: {
    districtId: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
  serviceAreaCount: number;
  organizationId: string | null;
  attributes: Record<string, unknown>;
  attributeDefs: ReadonlyArray<Pick<AttributeDefinition, 'key' | 'required'>>;
  details: ListingDetailsInput;
  /** Hukuki kapı: kategori (ya da üstü) lisanslı/YMYL ise onay gerekir (REQ-KAT-004). */
  legal: { required: boolean; approved: boolean };
  /** Bağlı görseller: lisans alanları eksik görsel yayımlanamaz (REQ-VER-014, Ek A14.6). */
  media?: ReadonlyArray<{ licenseComplete: boolean; altText: string | null }>;
}

const hasContact = (c: Record<string, unknown>) =>
  ['phone', 'website', 'email', 'reservationUrl'].some((k) => typeof c[k] === 'string' && c[k]);

/**
 * Yayın için zorunlu alanlar (REQ-LST-001, Ek A4.4). Boş dizi = yayımlanabilir.
 * "Bilinmiyor" kabul edilen alanlar (fiyat seviyesi, saatler) burada zorunlu tutulmaz (REQ-LST-002).
 */
export function publishBlockers(l: PublishInput): Issue[] {
  const out: Issue[] = [];
  const add = (pointer: string, code: string) => out.push({ pointer, code });

  if (!l.categoryPublished) add('/primaryCategoryId', 'category_not_published');
  if (l.legal.required && !l.legal.approved) add('/primaryCategoryId', 'legal_gate_closed');
  if (l.dataOrigin === 'DEMO' && l.appEnv === 'production')
    add('/dataOrigin', 'demo_in_production');
  if (l.media?.some((m) => !m.licenseComplete)) add('/media', 'media_license_incomplete');
  if (l.media?.some((m) => !m.altText)) add('/media', 'media_alt_required');
  for (const d of l.attributeDefs) {
    const v = l.attributes[d.key];
    if (d.required && (v === undefined || v === null || v === '')) {
      add(`/attributes/${d.key}`, 'attribute_required');
    }
  }

  const loc = l.location;
  const needCoordinates = () => {
    if (!loc) add('/location', 'location_required');
    else if (loc.latitude === null) add('/location/latitude', 'coordinates_required');
  };
  const needDistrict = () => {
    if (loc && !loc.districtId) add('/location/districtId', 'district_required');
  };
  const needContact = () => {
    if (!hasContact(l.contacts)) add('/contacts', 'contact_required');
  };

  switch (l.kind) {
    case 'PLACE':
      needCoordinates();
      needDistrict();
      needContact();
      break;
    case 'LODGING':
      needCoordinates();
      needDistrict();
      needContact();
      if (!l.details.lodging?.tourismLicenseNo) {
        add('/details/lodging/tourismLicenseNo', 'license_no_required');
      }
      break;
    case 'PRODUCT': {
      if (!l.details.product?.brand || !l.details.product.model) {
        add('/details/product', 'brand_model_required');
      }
      const filled = Object.values(l.attributes).filter(
        (v) => v !== null && v !== undefined && v !== '',
      ).length;
      if (filled < 5) add('/attributes', 'specs_min_5');
      break;
    }
    case 'SERVICE_PROVIDER':
      if (!loc && l.serviceAreaCount === 0) add('/location', 'location_or_service_area_required');
      needContact();
      break;
    case 'EXPERIENCE':
      if (!l.organizationId) add('/organizationId', 'organization_required');
      if (!l.details.experience?.startPoint) {
        add('/details/experience/startPoint', 'start_point_required');
      }
      if (!l.details.experience?.durationMinutes) {
        add('/details/experience/durationMinutes', 'duration_required');
      }
      break;
    case 'EVENT':
      if (!l.details.event?.startsAt || !l.details.event.endsAt) {
        add('/details/event/startsAt', 'event_dates_required');
      }
      if (!l.details.event?.venueListingId) add('/details/event/venueListingId', 'venue_required');
      break;
    case 'GUIDE_PERSON':
      if (l.serviceAreaCount === 0) add('/serviceAreaProvinceIds', 'service_area_required');
      if (!l.details.guide?.languages?.length)
        add('/details/guide/languages', 'languages_required');
      if (!l.details.guide?.licenseVerifiedAt) {
        add('/details/guide/licenseVerifiedAt', 'license_verification_required');
      }
      if (!l.details.guide?.consentAt) add('/details/guide/consentAt', 'consent_required');
      break;
    case 'DESTINATION':
      if (!loc) add('/location', 'location_required');
      if (!l.shortDescription) add('/shortDescription', 'summary_required');
      break;
    case 'POI':
      needCoordinates();
      break;
    case 'WORK':
      add('/kind', 'kind_not_available');
      break;
  }
  return out;
}
